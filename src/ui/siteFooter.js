/**
 * פוטר משפטי — קישורים להצהרות שיהיו מוכנים לעלייה לאינטרנט.
 */

import {
  ACCESSIBILITY_PAGE,
  PRIVACY_PAGE,
  TERMS_PAGE,
} from './navigation.js';

/**
 * בונה פוטר עם קישורים לנגישות, פרטיות ותנאי שימוש.
 * @returns {string}
 */
export function getSiteFooterMarkup() {
  return `
    <footer class="site-footer" aria-label="מידע משפטי ונגישות">
      <nav class="site-footer__nav" aria-label="מסמכים משפטיים">
        <a class="site-footer__link" href="${ACCESSIBILITY_PAGE}">הצהרת נגישות</a>
        <a class="site-footer__link" href="${PRIVACY_PAGE}">מדיניות פרטיות</a>
        <a class="site-footer__link" href="${TERMS_PAGE}">תנאי שימוש</a>
      </nav>
      <p class="site-footer__note">הבנק שלנו — דמו לימודי · אינו מוסד פיננסי</p>
    </footer>
  `;
}
