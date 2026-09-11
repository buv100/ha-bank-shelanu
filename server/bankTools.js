/**
 * הכלים (MCP tools) שמקבל הסוכן bank-risk-expert כשהוא רץ דרך Claude Agent SDK.
 * הסקיל עצמו (references/report-templates.md) מכיל את הידע העסקי — איזה
 * שאילתה להריץ בשביל איזה דוח, איך נראה ציון סיכון וכו'. הכלים כאן הם
 * הפרימיטיבים הגנריים בלבד: להריץ SQL קריאה, לבצע כתיבה מבוקרת (חסימת
 * כרטיס / החלטת הלוואה) עם רשת הביטחון האמורה בסעיף 5 ב-SKILL.md, וליצור
 * קובץ דוח מקומי.
 *
 * חיבור ה-DB הוא חיבור Postgres ישיר (לא Supabase JS) — כדי שאפשר יהיה
 * להריץ בדיוק את שאילתות ה-SQL (עם JOIN/CTE) שמופיעות ב-references/report-templates.md,
 * לא רק CRUD טבלאי. החיבור הזה עוקף RLS לגמרי (מתחבר כ-postgres), ולכן
 * צריך SUPABASE_DB_URL ולא לחשוף אותו לעולם לצד לקוח.
 *
 * הערה: במקור הדוחות היו אמורים לצאת כ-Google Docs אמיתיים (כך שכתוב
 * עדיין ב-SKILL.md/report-templates.md), אבל service account "רגיל" (לא
 * Google Workspace) לא מקבל מכסת אחסון ב-Drive ולא יכול ליצור מסמכים —
 * מגבלה של Google, לא באג כאן. הוחלט לוותר על Google Docs ולהסתפק בקובץ
 * Markdown מקומי (ראו createReportFile למטה).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';

const REPORTS_DIR = join(process.cwd(), 'reports');

/**
 * ממיר "סעיפים" גנריים (כותרת/פסקאות/טבלה) לטקסט Markdown, ושומר קובץ מקומי.
 * @param {{ title: string, sections: Array<{ heading?: string, headingLevel?: number, paragraphs?: string[], table?: { headers: string[], rows: string[][] } }> }} input
 * @returns {Promise<string>} נתיב הקובץ שנשמר
 */
export async function saveReportFile({ title, sections }) {
  const lines = [`# ${title}`, ''];

  for (const section of sections) {
    if (section.heading) {
      lines.push(`${'#'.repeat(section.headingLevel || 2)} ${section.heading}`, '');
    }

    for (const paragraph of section.paragraphs || []) {
      lines.push(paragraph, '');
    }

    if (section.table) {
      lines.push(`| ${section.table.headers.join(' | ')} |`);
      lines.push(`|${section.table.headers.map(() => '---').join('|')}|`);
      for (const row of section.table.rows) {
        lines.push(`| ${row.join(' | ')} |`);
      }
      lines.push('');
    }
  }

  await mkdir(REPORTS_DIR, { recursive: true });
  const fileName = `${new Date().toISOString().replace(/[:.]/g, '-')}_${title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 60)}.md`;
  const filePath = join(REPORTS_DIR, fileName);
  await writeFile(filePath, lines.join('\n'), 'utf8');
  return filePath;
}

// רשת ביטחון (blast radius) — סעיף 5 ב-SKILL.md: מעל 5 ישויות בפעולת כתיבה
// אחת מפקודה בודדת → עוצרים, לא מבצעים.
const MAX_ENTITIES_PER_WRITE = 5;

const WRITE_SQL_PATTERN = /\b(insert|update|delete|drop|alter|truncate|grant|revoke)\b/i;

/**
 * @param {import('pg').Client} db
 * @param {{ action: string, originalCommand: string, entityIds: string[] }} input
 */
async function recordSafetyStop(db, { action, originalCommand, entityIds }) {
  await db.query(
    `insert into public.audit_log (user_id, action, entity_type, entity_id, meta)
     values (null, 'safety_stop', $1, null, $2::jsonb)`,
    [
      action,
      JSON.stringify({
        original_command: originalCommand,
        affected_entity_count: entityIds.length,
        affected_entity_ids: entityIds,
        threshold: MAX_ENTITIES_PER_WRITE,
      }),
    ],
  );
}

/**
 * הליבה של run_sql_query — נפרדת מ-tool() כדי שאפשר יהיה לקרוא לה ישירות
 * (בדיקות, הדגמות) בלי לעבור דרך שכבת ה-MCP.
 * @param {import('pg').Client} db
 * @param {string} sql
 */
export async function runSqlQueryCore(db, sql) {
  const trimmed = sql.trim().replace(/;+\s*$/, '');

  if (WRITE_SQL_PATTERN.test(trimmed) || !/^select\b|^with\b/i.test(trimmed)) {
    throw new Error('הכלי הזה מריץ רק שאילתות SELECT/WITH לקריאה. לכתיבה יש להשתמש ב-blockCardsCore / decideLoansCore.');
  }

  const { rows } = await db.query(trimmed);
  return rows;
}

/**
 * הליבה של block_cards — כולל אכיפת רשת הביטחון (סעיף 5 ב-SKILL.md).
 * @param {import('pg').Client} db
 * @param {{ cardIds: string[], reason: string, triggerIndicator: string, originalCommand: string }} args
 * @returns {Promise<{ blocked: string[], safetyStopped: boolean }>}
 */
export async function blockCardsCore(db, { cardIds, reason, triggerIndicator, originalCommand }) {
  if (cardIds.length > MAX_ENTITIES_PER_WRITE) {
    await recordSafetyStop(db, { action: 'block_card', originalCommand, entityIds: cardIds });
    return { blocked: [], safetyStopped: true };
  }

  const blocked = [];

  for (const cardId of cardIds) {
    await db.query('begin');
    try {
      const { rowCount } = await db.query(
        `update public.cards set blocked = true, status = 'blocked' where id = $1`,
        [cardId],
      );

      if (rowCount === 0) {
        await db.query('rollback');
        continue;
      }

      await db.query(
        `insert into public.audit_log (user_id, action, entity_type, entity_id, meta)
         select user_id, 'auto_block_card', 'card', id,
                jsonb_build_object('reason', $2::text, 'trigger', $3::text)
         from public.cards where id = $1`,
        [cardId, reason, triggerIndicator],
      );
      await db.query('commit');
      blocked.push(cardId);
    } catch (error) {
      await db.query('rollback');
      throw error;
    }
  }

  return { blocked, safetyStopped: false };
}

/**
 * הליבה של decide_loans — כולל אכיפת רשת הביטחון (סעיף 5 ב-SKILL.md).
 * @param {import('pg').Client} db
 * @param {{ loanIds: string[], decision: 'approved' | 'rejected', reason: string, originalCommand: string }} args
 * @returns {Promise<{ decided: string[], safetyStopped: boolean }>}
 */
export async function decideLoansCore(db, { loanIds, decision, reason, originalCommand }) {
  if (loanIds.length > MAX_ENTITIES_PER_WRITE) {
    await recordSafetyStop(db, { action: `loan_${decision}`, originalCommand, entityIds: loanIds });
    return { decided: [], safetyStopped: true };
  }

  const action = decision === 'approved' ? 'loan_approved' : 'loan_rejected';
  const decided = [];

  for (const loanId of loanIds) {
    await db.query('begin');
    try {
      const { rowCount } = await db.query(
        `update public.loan_applications set status = $2 where id = $1`,
        [loanId, decision],
      );

      if (rowCount === 0) {
        await db.query('rollback');
        continue;
      }

      await db.query(
        `insert into public.audit_log (user_id, action, entity_type, entity_id, meta)
         select user_id, $2, 'loan_application', id, jsonb_build_object('reason', $3::text)
         from public.loan_applications where id = $1`,
        [loanId, action, reason],
      );
      await db.query('commit');
      decided.push(loanId);
    } catch (error) {
      await db.query('rollback');
      throw error;
    }
  }

  return { decided, safetyStopped: false };
}

/**
 * בונה את שרת ה-MCP הפנימי עם כל כלי ה-DB / דוחות שהסוכן יכול להשתמש בהם.
 * @param {{ db: import('pg').Client }} input
 */
export function createBankTools({ db }) {
  const runSqlQuery = tool(
    'run_sql_query',
    'מריץ שאילתת SQL לקריאה בלבד (SELECT) מול ה-DB של הבנק, ומחזיר את השורות כ-JSON. משמש להפקת דוחות ולחישוב ציוני סיכון — יש להשתמש בשאילתות מ-references/report-templates.md כשרלוונטי.',
    { sql: z.string().describe('שאילתת SELECT יחידה') },
    async ({ sql }) => {
      try {
        const rows = await runSqlQueryCore(db, sql);
        return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `שגיאת SQL: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  const blockCards = tool(
    'block_cards',
    `חוסם כרטיס/ים (cards.blocked=true, status='blocked') ורושם audit_log לכל כרטיס. אם מספר הכרטיסים בפקודה אחת גדול מ-${MAX_ENTITIES_PER_WRITE} — לא מבצע כלום, רק רושם safety_stop ומחזיר את רשימת הכרטיסים לבירור.`,
    {
      cardIds: z.array(z.string().uuid()).min(1).describe('מזהי cards.id לחסימה'),
      reason: z.string().describe('הנימוק לחסימה, ייכתב ל-audit_log.meta.reason'),
      triggerIndicator: z.string().describe('איזה אינדיקטור מסעיף 3 ב-SKILL.md הפעיל את החסימה (או "manual" אם זו בקשה ישירה של המנהל)'),
      originalCommand: z.string().describe('הפקודה החופשית המקורית של המנהל, לצורך תיעוד safety_stop'),
    },
    async ({ cardIds, reason, triggerIndicator, originalCommand }) => {
      const { blocked, safetyStopped } = await blockCardsCore(db, { cardIds, reason, triggerIndicator, originalCommand });

      if (safetyStopped) {
        return {
          content: [{
            type: 'text',
            text: `רשת הביטחון עצרה את הפעולה: ${cardIds.length} כרטיסים בפקודה אחת (סף: ${MAX_ENTITIES_PER_WRITE}). לא בוצעה שום חסימה. יש לפצל לפקודה ממוקדת יותר, או לאשר במפורש. מזהי הכרטיסים: ${cardIds.join(', ')}`,
          }],
          isError: true,
        };
      }

      return { content: [{ type: 'text', text: `נחסמו ${blocked.length} כרטיסים: ${blocked.join(', ')}` }] };
    },
  );

  const decideLoans = tool(
    'decide_loans',
    `מעדכן loan_applications.status ('approved'/'rejected') ורושם audit_log לכל בקשה. אם מספר הבקשות בפקודה אחת גדול מ-${MAX_ENTITIES_PER_WRITE} — לא מבצע כלום, רק רושם safety_stop.`,
    {
      loanIds: z.array(z.string().uuid()).min(1).describe('מזהי loan_applications.id'),
      decision: z.enum(['approved', 'rejected']),
      reason: z.string().describe('הנימוק להחלטה (ציון סיכון, השוואה ל-getMaxLoanAmount וכו׳), ייכתב ל-audit_log.meta.reason'),
      originalCommand: z.string(),
    },
    async ({ loanIds, decision, reason, originalCommand }) => {
      const { decided, safetyStopped } = await decideLoansCore(db, { loanIds, decision, reason, originalCommand });

      if (safetyStopped) {
        return {
          content: [{
            type: 'text',
            text: `רשת הביטחון עצרה את הפעולה: ${loanIds.length} בקשות הלוואה בפקודה אחת (סף: ${MAX_ENTITIES_PER_WRITE}). לא בוצעה שום החלטה. מזהי הבקשות: ${loanIds.join(', ')}`,
          }],
          isError: true,
        };
      }

      return { content: [{ type: 'text', text: `עודכנו ${decided.length} בקשות הלוואה ל-${decision}: ${decided.join(', ')}` }] };
    },
  );

  const createReportFile = tool(
    'create_report_file',
    'יוצר קובץ דוח מקומי (Markdown) בתיקיית reports/ מכותרת + רשימת סעיפים (כותרות, פסקאות, טבלאות), ומחזיר את הנתיב. משמש להפקת כל אחד מ-7 תבניות הדוח (לא Google Docs — ראו הערה ב-SKILL.md).',
    {
      title: z.string(),
      sections: z.array(z.object({
        heading: z.string().optional(),
        headingLevel: z.number().int().min(1).max(3).optional(),
        paragraphs: z.array(z.string()).optional(),
        table: z.object({
          headers: z.array(z.string()),
          rows: z.array(z.array(z.string())),
        }).optional(),
      })),
    },
    async ({ title, sections }) => {
      try {
        const filePath = await saveReportFile({ title, sections });
        return { content: [{ type: 'text', text: `הדוח נשמר: ${filePath}` }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `שגיאה בשמירת הדוח: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  return createSdkMcpServer({
    name: 'bank-risk-tools',
    version: '1.0.0',
    tools: [runSqlQuery, blockCards, decideLoans, createReportFile],
  });
}
