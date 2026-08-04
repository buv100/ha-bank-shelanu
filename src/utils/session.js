/**
 * Session משתמש מחובר בדמו —
 * נשמר ב־sessionStorage; בלי שרת ובלי אדמין בשלב זה.
 */

import { findUserById } from '../data/mockUsers.js';

const SESSION_USER_KEY = 'ha-bank-current-user';

/** נתיב להתחברות — ללא ייבוא מ־navigation (מונע מעגל עם logout) */
const LOGIN_PAGE = `${import.meta.env.BASE_URL}index.html`;

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
  return Boolean(getCurrentUserId() && findUserById(getCurrentUserId()));
}

/**
 * מחזיר את אובייקט המשתמש המלא, או null.
 * @returns {import('../data/mockUsers.js').DemoUser | null}
 */
export function getCurrentUser() {
  const id = getCurrentUserId();

  if (!id) {
    return null;
  }

  return findUserById(id) || null;
}

/**
 * שומר משתמש מחובר בסשן.
 * @param {string} userId
 * @returns {boolean} האם ההתחברות הצליחה
 */
export function loginAs(userId) {
  const user = findUserById(userId);

  if (!user) {
    return false;
  }

  window.sessionStorage.setItem(SESSION_USER_KEY, userId);
  return true;
}

/**
 * מנתק את המשתמש מהסשן.
 */
export function logout() {
  window.sessionStorage.removeItem(SESSION_USER_KEY);
}

/**
 * פרופיל המשתמש המחובר.
 * @returns {object | null}
 */
export function getCurrentProfile() {
  return getCurrentUser()?.profile || null;
}

/**
 * חשבון העו״ש של המשתמש המחובר.
 * @returns {object | null}
 */
export function getCurrentAccount() {
  return getCurrentUser()?.account || null;
}

/**
 * תנועות המשתמש המחובר.
 * @returns {object[]}
 */
export function getCurrentTransactions() {
  return getCurrentUser()?.transactions || [];
}

/**
 * כרטיסי המשתמש המחובר.
 * @returns {object[]}
 */
export function getCurrentCards() {
  return getCurrentUser()?.cards || [];
}

/**
 * אם אין משתמש מחובר — מעביר לדף התחברות.
 * @returns {boolean} true אם מחובר ומותר להמשיך
 */
export function requireAuth() {
  if (isLoggedIn()) {
    return true;
  }

  window.location.assign(LOGIN_PAGE);
  return false;
}
