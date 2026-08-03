/**
 * כתובות הדפים בפרויקט.
 * כל מסך הוא קובץ HTML נפרד — מעבר אמיתי בין דפים.
 */

/** נתיב לדף ההתחברות */
export const LOGIN_PAGE = '/index.html';

/** נתיב לדף העו״ש */
export const ACCOUNT_PAGE = '/account.html';

/** נתיב לדף הכרטיסים */
export const CARDS_PAGE = '/cards.html';

/** נתיב לדף הפרופיל */
export const PROFILE_PAGE = '/profile.html';

/** נתיב לדף בקשת הלוואה — לא בתפריט, רק מ־"לפרטים" */
export const LOAN_PAGE = '/loan.html';

/** הצהרת נגישות */
export const ACCESSIBILITY_PAGE = '/accessibility.html';

/** מדיניות פרטיות */
export const PRIVACY_PAGE = '/privacy.html';

/** תנאי שימוש ודיסקליימר */
export const TERMS_PAGE = '/terms.html';

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
