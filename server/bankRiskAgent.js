/**
 * מידלוור Vite (רץ רק מקומית, כמו server/groqChat.js) לדף האדמין:
 * /api/admin/login   — התחברות המנהל היחיד (NACHOM)
 * /api/admin/command — פענוח פקודה חופשית דרך Claude Agent SDK עם הסקיל
 *                      bank-risk-expert טעון, וכלי ה-DB/Google Docs מ-bankTools.js
 *
 * חשוב: זה בכוונה לא שרת נפרד שרץ כתהליך משלו — הוא חי בתוך תהליך ה-Vite
 * dev server (configureServer ב-vite.config.js), בדיוק כמו הפרוקסי הקיים
 * ל-Groq. זה אומר שה-service_role/DB secret לעולם לא מגיע ל-build הסטטי
 * (dist/, שמתפרסם ל-GitHub Pages) — הוא קיים רק כשמריצים `npm run dev`
 * מקומית. כשירצו סביבת production אמיתית, זה יצטרך לעבור לשרת/Worker
 * נפרד שרץ תמיד (בדומה למה שנדרש ל-Groq chat, שגם הוא עדיין לא פרוס).
 */

import { Client } from 'pg';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { signAdminToken, tryAdminLogin, verifyAdminToken } from './adminAuth.js';
import { createBankTools } from './bankTools.js';
import { loadGoogleDocsAuth } from './googleDocs.js';

/**
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * @param {import('http').ServerResponse} res
 */
function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {object} body
 */
function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/**
 * @param {{ supabaseUrl: string, supabaseAnonKey: string, sessionSecret: string, dbUrl: string }} options
 */
export function createAdminLoginMiddleware(options) {
  return (req, res) => {
    handleAdminLogin(req, res, options).catch((error) => {
      console.error('[admin-login]', error);
      if (!res.writableEnded) {
        sendJson(res, 500, { error: 'שגיאת שרת בהתחברות' });
      }
    });
  };
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ supabaseUrl: string, supabaseAnonKey: string, sessionSecret: string, dbUrl: string }} options
 */
async function handleAdminLogin(req, res, options) {
  if (req.method === 'OPTIONS') {
    withCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }

  withCors(res);

  if (!options.sessionSecret) {
    sendJson(res, 500, { error: 'חסר ADMIN_SESSION_SECRET ב-.env' });
    return;
  }

  if (!options.dbUrl) {
    sendJson(res, 500, { error: 'חסר SUPABASE_DB_URL ב-.env' });
    return;
  }

  let body;
  try {
    body = JSON.parse((await readBody(req)) || '{}');
  } catch {
    sendJson(res, 400, { error: 'בקשה לא תקינה' });
    return;
  }

  const dbClient = new Client({ connectionString: options.dbUrl });
  // pg זורק event 'error' בנפרד מה-promise של connect() — בלי מאזין כאן
  // Node מתייחס לזה כ-uncaught exception ומפיל את כל תהליך ה-dev server.
  dbClient.on('error', (err) => console.error('[pg]', err.message));

  try {
    await dbClient.connect();
    const result = await tryAdminLogin({
      username: String(body.username || ''),
      password: String(body.password || ''),
      supabaseUrl: options.supabaseUrl,
      supabaseAnonKey: options.supabaseAnonKey,
      dbClient,
    });

    if (!result.ok) {
      sendJson(res, 401, { error: result.error });
      return;
    }

    const token = signAdminToken({ secret: options.sessionSecret, userId: result.userId });
    sendJson(res, 200, { token });
  } catch (error) {
    console.error('[admin-login]', error);
    const msg = String(error?.message || error || '');
    if (/ENOTFOUND|ENOENT|getaddrinfo|ECONNREFUSED/i.test(msg)) {
      sendJson(res, 503, {
        error: 'אין חיבור למסד הנתונים. בדקו שפרויקט Supabase פעיל ו־SUPABASE_DB_URL ב-.env נכון.',
      });
      return;
    }
    sendJson(res, 500, { error: 'שגיאת שרת בהתחברות' });
  } finally {
    await dbClient.end().catch(() => {});
  }
}

/**
 * @param {{
 *   sessionSecret: string,
 *   dbUrl: string,
 *   anthropicApiKey: string,
 *   googleServiceAccountKeyPath?: string,
 * }} options
 */
export function createAdminCommandMiddleware(options) {
  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      withCors(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method not allowed' });
      return;
    }

    withCors(res);

    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
    const userId = options.sessionSecret ? verifyAdminToken({ secret: options.sessionSecret, token }) : null;

    if (!userId) {
      sendJson(res, 403, { error: 'אין הרשאה — יש להתחבר מחדש כמנהל' });
      return;
    }

    if (!options.anthropicApiKey) {
      sendJson(res, 500, { error: 'חסר ANTHROPIC_API_KEY ב-.env' });
      return;
    }

    let body;
    try {
      body = JSON.parse((await readBody(req)) || '{}');
    } catch {
      sendJson(res, 400, { error: 'בקשה לא תקינה' });
      return;
    }

    const command = String(body.command || '').trim();

    if (!command) {
      sendJson(res, 400, { error: 'חסרה פקודה' });
      return;
    }

    const dbClient = new Client({ connectionString: options.dbUrl });
    // pg זורק event 'error' בנפרד מה-promise של connect() — בלי מאזין כאן
    // Node מתייחס לזה כ-uncaught exception ומפיל את כל תהליך ה-dev server.
    dbClient.on('error', (err) => console.error('[pg]', err.message));

    try {
      await dbClient.connect();

      const googleDocsAuth = options.googleServiceAccountKeyPath
        ? await loadGoogleDocsAuth(options.googleServiceAccountKeyPath).catch((error) => {
            console.warn('[admin-command] Google Docs auth failed:', error.message);
            return null;
          })
        : null;

      const bankTools = createBankTools({ db: dbClient, googleDocsAuth });

      let finalText = '';

      for await (const message of query({
        prompt: command,
        options: {
          model: 'claude-sonnet-5',
          cwd: process.cwd(),
          settingSources: ['user'],
          skills: ['bank-risk-expert'],
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          mcpServers: { 'bank-risk-tools': bankTools },
          env: { ...process.env, ANTHROPIC_API_KEY: options.anthropicApiKey },
        },
      })) {
        if (message.type === 'result') {
          finalText = message.subtype === 'success' ? message.result : `שגיאה: ${message.subtype}`;
        }
      }

      sendJson(res, 200, { reply: finalText || 'הסוכן לא החזיר תשובה.' });
    } catch (error) {
      console.error('[admin-command]', error);
      sendJson(res, 502, { error: 'שגיאה בהרצת הסוכן', detail: error instanceof Error ? error.message : String(error) });
    } finally {
      await dbClient.end().catch(() => {});
    }
  };
}
