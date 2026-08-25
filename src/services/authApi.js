/**
 * הרשמה והתחברות מול Supabase Auth — שם משתמש + סיסמה, בלי אימות מייל או SMS.
 */

import { getSupabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * ממיר טלפון ישראלי לפורמט E.164 (+972…).
 * @param {string} raw
 * @returns {string | null}
 */
export function formatPhoneE164(raw) {
  const digits = String(raw || '').replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  if (digits.startsWith('972') && digits.length >= 11) {
    return `+${digits}`;
  }

  if (digits.startsWith('0') && digits.length >= 9) {
    return `+972${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith('5')) {
    return `+972${digits}`;
  }

  if (String(raw || '').trim().startsWith('+') && digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

/**
 * @param {string} username
 * @returns {Promise<string | null>}
 */
async function emailForUsername(username) {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc('email_for_username', {
    p_username: username.trim(),
  });

  if (error) {
    console.warn('[auth] email_for_username', error.message);
    return null;
  }

  return data ? String(data) : null;
}

/**
 * @param {{ username: string, password: string }} input
 * @returns {Promise<{ ok: boolean, userId?: string, error?: string }>}
 */
export async function signInWithUsername(input) {
  const supabase = getSupabase();

  if (!supabase) {
    return { ok: false, error: 'חסר חיבור ל־Supabase' };
  }

  const email = await emailForUsername(input.username);

  if (!email) {
    return { ok: false, error: 'שם משתמש או סיסמה שגויים' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error || !data.user) {
    const msg = String(error?.message || '').toLowerCase();

    if (msg.includes('email not confirmed')) {
      return {
        ok: false,
        error: 'החשבון מחכה לאימות מייל. ב־Supabase כבו Confirm email והריצו auto_confirm.sql.',
      };
    }

    return { ok: false, error: 'שם משתמש או סיסמה שגויים' };
  }

  return { ok: true, userId: data.user.id };
}

/**
 * @param {{ username: string, email: string, password: string, fullName: string }} input
 * @returns {Promise<{ ok: boolean, userId?: string, error?: string }>}
 */
export async function signUpWithUsername(input) {
  const supabase = getSupabase();

  if (!supabase) {
    return { ok: false, error: 'חסר חיבור ל־Supabase' };
  }

  const username = input.username.trim();
  const email = input.email.trim();

  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    return { ok: false, error: 'שם משתמש: 3–32 תווים באנגלית, מספרים, נקודה או מקף' };
  }

  if (input.password.length < 8) {
    return { ok: false, error: 'הסיסמה חייבת לפחות 8 תווים' };
  }

  const initials = input.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        username,
        full_name: input.fullName.trim(),
        initials: initials || username.slice(0, 2),
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message || 'ההרשמה נכשלה' };
  }

  if (data.session?.user) {
    return { ok: true, userId: data.session.user.id };
  }

  const signIn = await supabase.auth.signInWithPassword({ email, password: input.password });

  if (signIn.error || !signIn.data.user) {
    return {
      ok: false,
      error: 'נרשמתם, אבל הכניסה נכשלה. ודאו ש־Confirm email כבוי ב־Supabase והריצו auto_confirm.sql.',
    };
  }

  return { ok: true, userId: signIn.data.user.id };
}

/**
 * @returns {Promise<string | null>}
 */
export async function getAuthUserId() {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

/**
 * @returns {Promise<void>}
 */
export async function signOutRemote() {
  const supabase = getSupabase();

  if (supabase) {
    await supabase.auth.signOut();
  }
}

export { isSupabaseConfigured };
