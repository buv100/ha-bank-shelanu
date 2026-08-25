/**
 * כתובות הדפים בפרויקט.
 * משתמשים ב־BASE_URL כדי שיעבוד גם ב־GitHub Pages (תת־תיקייה).
 */

import { logout } from '../utils/session.js';

/** בסיס הנתיב מה־Vite (במקומי "/" וב־Pages למשל "/ha-bank-shelanu/") */
const BASE = import.meta.env.BASE_URL;

/**
 * בונה נתיב דף יחסית ל־base של האתר.
 * @param {string} fileName
 * @returns {string}
 */
function pagePath(fileName) {
  return `${BASE}${fileName}`;
}

/** נתיב לדף הנחיתה (לפני התחברות) */
export const LANDING_PAGE = pagePath('index.html');

/** נתיב לדף ההתחברות */
export const LOGIN_PAGE = pagePath('login.html');

/** נתיב לדף העו״ש */
export const ACCOUNT_PAGE = pagePath('account.html');

/** נתיב לדף ריכוז יתרות */
export const OVERVIEW_PAGE = pagePath('overview.html');

/** נתיב לדף השקעות / מסחר */
export const INVESTMENTS_PAGE = pagePath('investments.html');

/** נתיב לחיפוש לקנייה במסחר */
export const INVESTMENTS_SEARCH_PAGE = pagePath('investments-search.html');

/** נתיב לדף פירוט השקעה */
export const INVESTMENT_DETAIL_PAGE = pagePath('investment-detail.html');

/**
 * בונה קישור לדף פירוט השקעה.
 * @param {{ holdingId?: string, marketId?: string }} params
 * @returns {string}
 */
export function getInvestmentDetailHref(params) {
  const query = new URLSearchParams();

  if (params.holdingId) {
    query.set('holding', params.holdingId);
  }

  if (params.marketId) {
    query.set('market', params.marketId);
  }

  const qs = query.toString();
  return qs ? `${INVESTMENT_DETAIL_PAGE}?${qs}` : INVESTMENT_DETAIL_PAGE;
}

/** נתיב לדף הכרטיסים */
export const CARDS_PAGE = pagePath('cards.html');

/** נתיב לדף העברות */
export const TRANSFERS_PAGE = pagePath('transfers.html');

/** נתיב לדף החסכונות */
export const SAVINGS_PAGE = pagePath('savings.html');

/** נתיב לדף הפרופיל */
export const PROFILE_PAGE = pagePath('profile.html');

/** נתיב לדף פתיחת חשבון (נתונים ראשוניים) */
export const SETUP_PAGE = pagePath('setup.html');

/** נתיב לדף בקשת הלוואה — לא בתפריט, רק מ־"לפרטים" */
export const LOAN_PAGE = pagePath('loan.html');

/** הצהרת נגישות */
export const ACCESSIBILITY_PAGE = pagePath('accessibility.html');

/** מדיניות פרטיות */
export const PRIVACY_PAGE = pagePath('privacy.html');

/** תנאי שימוש ודיסקליימר */
export const TERMS_PAGE = pagePath('terms.html');

/**
 * מעביר את המשתמש לדף העו״ש (דף HTML נפרד).
 */
export function goToAccountPage() {
  window.location.assign(ACCOUNT_PAGE);
}

/**
 * מעביר לדף ריכוז.
 */
export function goToOverviewPage() {
  window.location.assign(OVERVIEW_PAGE);
}

/**
 * מעביר את המשתמש לדף ההתחברות ומנתק מהסשן.
 */
export function goToLoginPage() {
  logout();
  window.location.assign(LOGIN_PAGE);
}
