/**
 * באנר דמו קבוע — מבהיר שזה לא בנק אמיתי.
 */

import { TERMS_PAGE } from './navigation.js';

/**
 * בונה באנר אזהרה לדמו (מוצג בכל המסכים).
 * @returns {string}
 */
export function getDemoBannerMarkup() {
  return `
    <div class="demo-banner" role="status">
      <p class="demo-banner__text">
        <strong>אתר דמו ללמידה בלבד.</strong>
        זה אינו בנק, אינו שירות פיננסי, ואין כאן כסף אמיתי או אימות אמיתי.
        <a class="demo-banner__link" href="${TERMS_PAGE}">תנאי שימוש</a>
      </p>
    </div>
  `;
}
