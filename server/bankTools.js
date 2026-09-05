/**
 * הכלים (MCP tools) שמקבל הסוכן bank-risk-expert כשהוא רץ דרך Claude Agent SDK.
 * הסקיל עצמו (references/report-templates.md) מכיל את הידע העסקי — איזה
 * שאילתה להריץ בשביל איזה דוח, איך נראה ציון סיכון וכו'. הכלים כאן הם
 * הפרימיטיבים הגנריים בלבד: להריץ SQL קריאה, לבצע כתיבה מבוקרת (חסימת
 * כרטיס / החלטת הלוואה) עם רשת הביטחון האמורה בסעיף 5 ב-SKILL.md, וליצור
 * מסמך Google Docs.
 *
 * חיבור ה-DB הוא חיבור Postgres ישיר (לא Supabase JS) — כדי שאפשר יהיה
 * להריץ בדיוק את שאילתות ה-SQL (עם JOIN/CTE) שמופיעות ב-references/report-templates.md,
 * לא רק CRUD טבלאי. החיבור הזה עוקף RLS לגמרי (מתחבר כ-postgres), ולכן
 * צריך SUPABASE_DB_URL ולא לחשוף אותו לעולם לצד לקוח.
 */

import { z } from 'zod';
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { createGoogleDoc } from './googleDocs.js';

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
 * בונה את שרת ה-MCP הפנימי עם כל כלי ה-DB / Google Docs שהסוכן יכול להשתמש בהם.
 * @param {{ db: import('pg').Client, googleDocsAuth: import('./googleDocs.js').GoogleDocsAuth | null }} input
 */
export function createBankTools({ db, googleDocsAuth }) {
  const runSqlQuery = tool(
    'run_sql_query',
    'מריץ שאילתת SQL לקריאה בלבד (SELECT) מול ה-DB של הבנק, ומחזיר את השורות כ-JSON. משמש להפקת דוחות ולחישוב ציוני סיכון — יש להשתמש בשאילתות מ-references/report-templates.md כשרלוונטי.',
    { sql: z.string().describe('שאילתת SELECT יחידה') },
    async ({ sql }) => {
      const trimmed = sql.trim().replace(/;+\s*$/, '');

      if (WRITE_SQL_PATTERN.test(trimmed) || !/^select\b|^with\b/i.test(trimmed)) {
        return {
          content: [{ type: 'text', text: 'שגיאה: הכלי הזה מריץ רק שאילתות SELECT/WITH לקריאה. לכתיבה יש להשתמש בכלי block_cards / decide_loans.' }],
          isError: true,
        };
      }

      try {
        const { rows } = await db.query(trimmed);
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
      if (cardIds.length > MAX_ENTITIES_PER_WRITE) {
        await recordSafetyStop(db, { action: 'block_card', originalCommand, entityIds: cardIds });
        return {
          content: [{
            type: 'text',
            text: `רשת הביטחון עצרה את הפעולה: ${cardIds.length} כרטיסים בפקודה אחת (סף: ${MAX_ENTITIES_PER_WRITE}). לא בוצעה שום חסימה. יש לפצל לפקודה ממוקדת יותר, או לאשר במפורש. מזהי הכרטיסים: ${cardIds.join(', ')}`,
          }],
          isError: true,
        };
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
      if (loanIds.length > MAX_ENTITIES_PER_WRITE) {
        await recordSafetyStop(db, { action: `loan_${decision}`, originalCommand, entityIds: loanIds });
        return {
          content: [{
            type: 'text',
            text: `רשת הביטחון עצרה את הפעולה: ${loanIds.length} בקשות הלוואה בפקודה אחת (סף: ${MAX_ENTITIES_PER_WRITE}). לא בוצעה שום החלטה. מזהי הבקשות: ${loanIds.join(', ')}`,
          }],
          isError: true,
        };
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

      return { content: [{ type: 'text', text: `עודכנו ${decided.length} בקשות הלוואה ל-${decision}: ${decided.join(', ')}` }] };
    },
  );

  const createDoc = tool(
    'create_google_doc',
    'יוצר מסמך Google Docs חדש מכותרת + רשימת סעיפים (כותרות, פסקאות, טבלאות), ומחזיר קישור לצפייה. משמש להפקת כל אחד מ-7 תבניות הדוח.',
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
      if (!googleDocsAuth) {
        return {
          content: [{ type: 'text', text: 'שגיאה: Google Docs לא מוגדר בשרת (חסר GOOGLE_SERVICE_ACCOUNT_KEY_PATH ב-.env).' }],
          isError: true,
        };
      }

      try {
        const url = await createGoogleDoc(googleDocsAuth, { title, sections });
        return { content: [{ type: 'text', text: `הדוח נוצר: ${url}` }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `שגיאה ביצירת המסמך: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    },
  );

  return createSdkMcpServer({
    name: 'bank-risk-tools',
    version: '1.0.0',
    tools: [runSqlQuery, blockCards, decideLoans, createDoc],
  });
}
