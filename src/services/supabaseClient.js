/**
 * לקוח Supabase לדפדפן — רק URL + מפתח publishable.
 */

import { createClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

/**
 * האם הוגדרו משתני סביבה ל־Supabase.
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(url && key);
}

/**
 * מחזיר את הלקוח, או null אם אין הגדרות.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
