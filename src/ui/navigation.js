/**
 * כתובות הדפים בפרויקט.
 * משתמשים ב־BASE_URL כדי שיעבוד גם ב־GitHub Pages (תת־תיקייה).
 */

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

/** נתיב לדף ההתחברות */
export const LOGIN_PAGE = pagePath('index.html');

/** נתיב לדף העו״ש */
export const ACCOUNT_PAGE = pagePath('account.html');

/** נתיב לדף הכרטיסים */
export const CARDS_PAGE = pagePath('cards.html');

/** נתיב לדף הפרופיל */
export const PROFILE_PAGE = pagePath('profile.html');

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
 * מעביר את המשתמש לדף ההתחברות.
 */
export function goToLoginPage() {
  window.location.assign(LOGIN_PAGE);
}
