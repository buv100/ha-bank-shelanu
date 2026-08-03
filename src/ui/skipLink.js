/**
 * קישור "דלג לתוכן" — נגישות: מאפשר לדלג על ניווט חוזר.
 */

/**
 * בונה קישור דילוג לתוכן הראשי.
 * @returns {string}
 */
export function getSkipLinkMarkup() {
  return `
    <a class="skip-link" href="#main-content">דלג לתוכן הראשי</a>
  `;
}
