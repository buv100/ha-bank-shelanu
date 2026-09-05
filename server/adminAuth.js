/**
 * אימות אדמין — מנהל יחיד (NACHOM), עם אותם username/password שיש לו
 * כבר באפליקציה הרגילה (Supabase auth). ה"התחברות מנהל" היא מסך נפרד,
 * אבל בודקת מול אותו Supabase project — כדי לא לנהל סיסמה שנייה.
 *
 * שני שלבי הגנה (לא סומכים על שם המשתמש בלבד):
 * 1. שם המשתמש שהוזן חייב להיות NACHOM (case-insensitive) — לפני שנוגעים ב-Supabase בכלל.
 * 2. גם אחרי שה-signIn הצליח, מוודאים בטבלת profiles (עם חיבור ה-DB הישיר,
 *    שעוקף RLS) שה-user_id שחזר שייך לרשומה עם username = NACHOM.
 *
 * הבדיקה חייבת לקרות כאן, בשרת — בדיקת הרשאה בצד לקוח (ה-JS שרץ בדפדפן)
 * אפשר תמיד לעקוף, כי המשתמש שולט על כל מה שרץ אצלו.
 */

import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';

const ADMIN_USERNAME = 'NACHOM';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // שעתיים — מספיק לסשן ניהול, לא נצחי

/**
 * חותם טוקן סשן קצר-מועד. לא JWT מלא (אין צורך בתלות נוספת) —
 * רק payload + חתימת HMAC, כדי שהשרת יוכל לאמת שהוא זה שהנפיק אותו.
 * @param {{ secret: string, userId: string }} input
 * @returns {string}
 */
export function signAdminToken({ secret, userId }) {
  const payload = JSON.stringify({ userId, exp: Date.now() + TOKEN_TTL_MS });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * מאמת טוקן סשן. מחזיר את ה-userId אם תקין ולא פג תוקף, אחרת null.
 * @param {{ secret: string, token: string }} input
 * @returns {string | null}
 */
export function verifyAdminToken({ secret, token }) {
  const parts = String(token || '').split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signature] = parts;
  const expectedSignature = createHmac('sha256', secret).update(payloadB64).digest('base64url');

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return null;
    }

    return String(payload.userId || '') || null;
  } catch {
    return null;
  }
}

/**
 * מנסה להתחבר כמנהל: שם המשתמש חייב להיות NACHOM, הסיסמה מאומתת מול
 * Supabase auth (אותה סיסמה שיש לו באפליקציה הרגילה), ואז מוודאים
 * ב-DB הישיר שה-id שחזר אכן שייך לפרופיל עם username = NACHOM.
 * @param {{
 *   username: string,
 *   password: string,
 *   supabaseUrl: string,
 *   supabaseAnonKey: string,
 *   dbClient: import('pg').Client,
 * }} input
 * @returns {Promise<{ ok: boolean, userId?: string, error?: string }>}
 */
export async function tryAdminLogin({ username, password, supabaseUrl, supabaseAnonKey, dbClient }) {
  if (String(username || '').trim().toUpperCase() !== ADMIN_USERNAME) {
    return { ok: false, error: 'אין הרשאת ניהול למשתמש הזה' };
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, error: 'חסרה תצורת Supabase בשרת (.env)' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: email, error: rpcError } = await supabase.rpc('email_for_username', {
    p_username: ADMIN_USERNAME,
  });

  if (rpcError || !email) {
    return { ok: false, error: 'שם משתמש או סיסמה שגויים' };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: String(email),
    password,
  });

  if (signInError || !signInData.user) {
    return { ok: false, error: 'שם משתמש או סיסמה שגויים' };
  }

  const userId = signInData.user.id;

  const { rows } = await dbClient.query(
    `select 1 from public.profiles where id = $1 and upper(username) = $2 limit 1`,
    [userId, ADMIN_USERNAME],
  );

  if (rows.length === 0) {
    return { ok: false, error: 'המשתמש שהתחבר אינו רשום כמנהל' };
  }

  return { ok: true, userId };
}
