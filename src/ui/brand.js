/**
 * מיתוג משותף — לוגו מומצא + שם הבנק.
 * הלוגו מוטמע כ־SVG בתוך הקוד כדי שתמיד יוצג (לא תלוי רק בקובץ חיצוני).
 */

/**
 * מחזיר HTML של הלוגו (אייקון עמודים מופשט בצבעי טורקיז/לבן).
 * @param {'md' | 'sm'} size - גודל התצוגה
 * @returns {string}
 */
export function getLogoMarkup(size = 'md') {
  const px = size === 'sm' ? 36 : 56;
  const className = size === 'sm' ? 'brand-logo brand-logo--sm' : 'brand-logo';

  return `
    <span class="${className}" aria-hidden="true" style="width:${px}px;height:${px}px">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="${px}" height="${px}">
        <rect x="4" y="4" width="72" height="72" rx="18" fill="#0D9488"/>
        <rect x="18" y="28" width="10" height="28" rx="3" fill="#FFFFFF"/>
        <rect x="35" y="20" width="10" height="36" rx="3" fill="#FFFFFF"/>
        <rect x="52" y="28" width="10" height="28" rx="3" fill="#FFFFFF"/>
        <rect x="18" y="58" width="44" height="6" rx="3" fill="#99F6E4"/>
      </svg>
    </span>
  `;
}

/**
 * מחזיר בלוק מיתוג מלא (לוגו + שם, ולפעמים סלוגן).
 * @param {{ size?: 'md' | 'sm', showTagline?: boolean, compact?: boolean }} options
 * @returns {string}
 */
export function getBrandMarkup(options = {}) {
  const size = options.size || 'md';
  const showTagline = Boolean(options.showTagline);
  const compact = Boolean(options.compact);
  const brandClass = compact ? 'brand brand--compact' : 'brand brand--login';

  const tagline = showTagline
    ? '<p class="brand-tagline">בנקאות פשוטה, ברורה ושקטה</p>'
    : '';

  return `
    <div class="${brandClass}">
      ${getLogoMarkup(size)}
      <div class="brand-text">
        <p class="brand-name">הבנק שלנו</p>
        ${tagline}
      </div>
    </div>
  `;
}
