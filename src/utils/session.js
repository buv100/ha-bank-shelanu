/**
 * Session משתמש מחובר —
 * דמו (mock) או סשן Supabase + מטמון מקומי.
 */

import { findUserById } from '../data/mockUsers.js';
import { getAuthUserId, isSupabaseConfigured, signOutRemote } from '../services/authApi.js';
import { startAutoActivity, stopAutoActivity } from '../services/autoActivity.js';
import { ensureCardDisplayFields } from '../services/bootstrapAccount.js';
import { hydrateUserFromSupabase } from '../services/supabaseHydrate.js';
import { ensureAccountData, getAccountData, listTransactions } from './accountStore.js';
import { ensureCardsData, getCardRuntime } from './cardStore.js';

const SESSION_USER_KEY = 'ha-bank-current-user';
const LIVE_USER_KEY = 'ha-bank-live-user';

/** נתיב להתחברות — ללא ייבוא מ־navigation (מונע מעגל עם logout) */
const LOGIN_PAGE = `${import.meta.env.BASE_URL}login.html`;
const SETUP_PAGE = `${import.meta.env.BASE_URL}setup.html`;

/**
 * @returns {object | null}
 */
function readLiveUser() {
  try {
    const raw = window.sessionStorage.getItem(LIVE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {object | null} user
 */
export function writeLiveUser(user) {
  if (!user) {
    window.sessionStorage.removeItem(LIVE_USER_KEY);
    return;
  }

  window.sessionStorage.setItem(LIVE_USER_KEY, JSON.stringify(user));
}

/**
 * מחזיר את מזהה המשתמש המחובר, או null.
 * @returns {string | null}
 */
export function getCurrentUserId() {
  return window.sessionStorage.getItem(SESSION_USER_KEY);
}

/**
 * האם יש משתמש מחובר.
 * @returns {boolean}
 */
export function isLoggedIn() {
  const id = getCurrentUserId();

  if (!id) {
    return false;
  }

  const live = readLiveUser();

  if (live?.id === id) {
    return true;
  }

  return Boolean(findUserById(id));
}

/**
 * מחזיר את אובייקט המשתמש המלא.
 * @returns {object | null}
 */
export function getCurrentUser() {
  const id = getCurrentUserId();

  if (!id) {
    return null;
  }

  const live = readLiveUser();

  if (live?.id === id) {
    return live;
  }

  return findUserById(id) || null;
}

/**
 * שומר משתמש דמו בסשן ומתחיל פעילות אוטומטית.
 * @param {string} userId
 * @returns {boolean}
 */
export function loginAs(userId) {
  const user = findUserById(userId);

  if (!user) {
    return false;
  }

  writeLiveUser(null);
  ensureAccountData(userId);
  ensureCardsData(userId);
  window.sessionStorage.setItem(SESSION_USER_KEY, userId);
  startAutoActivity(userId);
  return true;
}

/**
 * אחרי signIn ב־Supabase — טוען נתונים וממלא סשן.
 * @param {string} userId
 * @param {{ retries?: number }} [options]
 * @returns {Promise<boolean>}
 */
export async function completeSupabaseLogin(userId, options = {}) {
  const retries = Number(options.retries) || 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const live = await hydrateUserFromSupabase(userId);

    if (live) {
      writeLiveUser(live);
      window.sessionStorage.setItem(SESSION_USER_KEY, userId);
      ensureAccountData(userId);
      ensureCardsData(userId);
      startAutoActivity(userId);
      return true;
    }

    if (attempt < retries) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 350);
      });
    }
  }

  return false;
}

/**
 * משחזר סשן Supabase אחרי רענון דף.
 * @returns {Promise<boolean>}
 */
export async function restoreSupabaseSession() {
  const userId = await getAuthUserId();

  if (!userId) {
    return false;
  }

  const cached = readLiveUser();

  if (cached?.id === userId) {
    window.sessionStorage.setItem(SESSION_USER_KEY, userId);
    ensureAccountData(userId);
    ensureCardsData(userId);
    return true;
  }

  return completeSupabaseLogin(userId);
}

/**
 * מנתק את המשתמש מהסשן ועוצר אוטומציה.
 */
export function logout() {
  stopAutoActivity();
  writeLiveUser(null);
  window.sessionStorage.removeItem(SESSION_USER_KEY);

  if (isSupabaseConfigured()) {
    signOutRemote();
  }
}

/**
 * פרופיל המשתמש המחובר.
 * @returns {object | null}
 */
export function getCurrentProfile() {
  return getCurrentUser()?.profile || null;
}

/**
 * חשבון העו״ש של המשתמש המחובר (יתרה מה־store).
 * @returns {object | null}
 */
export function getCurrentAccount() {
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  if (!userId || !user) {
    return null;
  }

  const stored = getAccountData(userId) || ensureAccountData(userId);

  if (!stored) {
    return user.account || null;
  }

  return {
    id: stored.accountId || user.account?.id,
    type: stored.type || user.account?.type || 'checking',
    currency: stored.currency || user.account?.currency || 'ILS',
    balance: stored.balance,
  };
}

/**
 * תנועות העו״ש של המשתמש המחובר.
 * @returns {object[]}
 */
export function getCurrentTransactions() {
  const userId = getCurrentUserId();

  if (!userId) {
    return [];
  }

  return listTransactions(userId);
}

/**
 * כרטיסים עם נתוני runtime (חוב, מסגרת, תנועות).
 * @returns {object[]}
 */
export function getCurrentCards() {
  const userId = getCurrentUserId();
  const user = getCurrentUser();

  if (!userId || !user) {
    return [];
  }

  ensureCardsData(userId);

  return (user.cards || []).map((card) => {
    const display = ensureCardDisplayFields(card);
    const runtime = getCardRuntime(userId, display.id);
    const creditLimit = runtime?.creditLimit || 0;
    const debt = runtime?.debt || 0;
    const availableCredit = display.type === 'credit'
      ? Number((creditLimit - debt).toFixed(2))
      : null;

    return {
      ...display,
      lastFour: runtime?.lastFour || display.lastFour,
      numberMasked: `•••• •••• •••• ${runtime?.lastFour || display.lastFour}`,
      fullNumber: display.fullNumber,
      cvv: display.cvv,
      creditLimit,
      debt,
      availableCredit,
      blocked: Boolean(runtime?.blocked),
      status: runtime?.blocked ? 'blocked' : display.status,
      statusLabel: runtime?.blocked ? 'חסום' : display.statusLabel,
      cardTransactions: runtime?.transactions || [],
    };
  });
}

/**
 * האם המשתמש המחובר כבר מילא פתיחת חשבון.
 * @returns {boolean}
 */
export function isSetupComplete() {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const user = getCurrentUser();

  if (!user) {
    return false;
  }

  if (user.setupCompleted || user.source !== 'supabase') {
    return true;
  }

  try {
    return window.localStorage.getItem(`ha-bank-setup:${user.id}`) === '1';
  } catch {
    return false;
  }
}

/**
 * אם אין משתמש מחובר — מעביר לדף התחברות.
 * @param {{ allowIncompleteSetup?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export async function requireAuth(options = {}) {
  if (isSupabaseConfigured()) {
    const ok = await restoreSupabaseSession();

    if (!ok) {
      window.location.assign(LOGIN_PAGE);
      return false;
    }

    const userId = getCurrentUserId();
    ensureAccountData(userId);
    ensureCardsData(userId);

    if (!options.allowIncompleteSetup && !isSetupComplete()) {
      window.location.assign(SETUP_PAGE);
      return false;
    }

    if (!options.allowIncompleteSetup) {
      startAutoActivity(userId);
    }

    return true;
  }

  if (isLoggedIn()) {
    const userId = getCurrentUserId();
    ensureAccountData(userId);
    ensureCardsData(userId);
    startAutoActivity(userId);
    return true;
  }

  window.location.assign(LOGIN_PAGE);
  return false;
}
