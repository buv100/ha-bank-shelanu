/**
 * רכיב תצוגה ויזואלי של כרטיס בנקאי (דמו) — חזית בלבד.
 * לכל מוצר (חיוב / אשראי / זהב / נסיעות / דיגיטלי / פלטינום) יש וריאנט עיצוב.
 */

/**
 * מזהה את וריאנט העיצוב של הכרטיס.
 * @param {{ type?: string, variant?: string, productName?: string }} card
 * @returns {'platinum' | 'gold' | 'travel' | 'digital' | 'credit' | 'debit'}
 */
export function resolveCardVariant(card) {
  const name = card.productName || '';
  const explicit = card.variant || '';

  if (explicit === 'platinum' || /פלטינום|platinum/i.test(name)) {
    return 'platinum';
  }

  if (explicit === 'gold' || /זהב|gold/i.test(name)) {
    return 'gold';
  }

  if (explicit === 'travel' || /נסיעות|travel/i.test(name)) {
    return 'travel';
  }

  if (explicit === 'digital' || /דיגיטלי|digital/i.test(name)) {
    return 'digital';
  }

  if (card.type === 'credit' || explicit === 'credit') {
    return 'credit';
  }

  return 'debit';
}

/**
 * מחזיר מחלקת CSS לפי וריאנט.
 * @param {{ type?: string, variant?: string, productName?: string }} card
 * @returns {string}
 */
export function getBankCardVariantClass(card) {
  return ` bank-card--${resolveCardVariant(card)}`;
}

/**
 * תווית תג קטנה למוצרים מיוחדים.
 * @param {string} variant
 * @returns {string}
 */
function getBadgeLabel(variant) {
  if (variant === 'platinum') {
    return 'PLATINUM';
  }

  if (variant === 'gold') {
    return 'GOLD';
  }

  if (variant === 'travel') {
    return 'TRAVEL';
  }

  if (variant === 'digital') {
    return 'DIGITAL';
  }

  return '';
}

/**
 * שכבות דקורטיביות לפי וריאנט.
 * @param {string} variant
 * @returns {string}
 */
function getDecorMarkup(variant) {
  if (variant === 'platinum' || variant === 'gold') {
    return `
      <div class="bank-card__foil" aria-hidden="true"></div>
      <div class="bank-card__aurora" aria-hidden="true"></div>
    `;
  }

  if (variant === 'travel') {
    return `<div class="bank-card__route" aria-hidden="true"></div>`;
  }

  if (variant === 'digital') {
    return `<div class="bank-card__grid" aria-hidden="true"></div>`;
  }

  return '';
}

/**
 * בונה HTML של כרטיס פיזי למראה (ממוסך).
 * @param {{
 *   brandName: string,
 *   productName: string,
 *   holderName: string,
 *   numberMasked: string,
 *   expiry: string,
 *   network: string,
 *   type?: string,
 *   variant?: string
 * }} card
 * @returns {string}
 */
export function getBankCardMarkup(card) {
  const variant = resolveCardVariant(card);
  const variantClass = ` bank-card--${variant}`;
  const blockedClass = card.blocked ? ' bank-card--blocked' : '';
  const badgeLabel = getBadgeLabel(variant);
  const badge = badgeLabel
    ? `<span class="bank-card__badge">${badgeLabel}</span>`
    : '';
  const decor = getDecorMarkup(variant);
  const blockedBadge = card.blocked
    ? '<span class="bank-card__blocked-badge">חסום</span>'
    : '';

  return `
    <article class="bank-card bank-card--bold${variantClass}${blockedClass}" aria-label="${card.productName}${card.blocked ? ' — חסום' : ''}">
      <div class="bank-card__glow" aria-hidden="true"></div>
      <div class="bank-card__shine" aria-hidden="true"></div>
      <div class="bank-card__stripe" aria-hidden="true"></div>
      ${decor}
      ${blockedBadge}

      <div class="bank-card__top">
        <div class="bank-card__identity">
          <p class="bank-card__brand">${card.brandName}</p>
          <p class="bank-card__product">${card.productName}</p>
          ${badge}
        </div>
        <p class="bank-card__network">${card.network}</p>
      </div>

      <div class="bank-card__mid">
        <div class="bank-card__chip" aria-hidden="true"></div>
        <span class="bank-card__contactless" aria-hidden="true" title="ללא מגע">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M8.5 8.5c2.2 2.2 2.2 4.8 0 7"/>
            <path d="M11.2 6c3.8 3.5 3.8 8.5 0 12"/>
            <path d="M13.9 3.5c5.2 4.8 5.2 12.2 0 17"/>
          </svg>
        </span>
      </div>

      <p class="bank-card__number">${card.numberMasked}</p>

      <div class="bank-card__bottom">
        <div class="bank-card__meta">
          <p class="bank-card__meta-label">תוקף</p>
          <p class="bank-card__meta-value">${card.expiry}</p>
        </div>
        <div class="bank-card__meta bank-card__meta--holder">
          <p class="bank-card__meta-label">בעל הכרטיס</p>
          <p class="bank-card__meta-value" title="${card.holderName}">${card.holderName}</p>
        </div>
      </div>
    </article>
  `;
}

/**
 * מחזיר תג + דקור לשימוש במודל ההיפוך.
 * @param {object} card
 * @returns {{ variantClass: string, decor: string, badge: string }}
 */
export function getCardVisualExtras(card) {
  const variant = resolveCardVariant(card);
  const badgeLabel = getBadgeLabel(variant);

  return {
    variantClass: ` bank-card--${variant}`,
    decor: getDecorMarkup(variant),
    badge: badgeLabel ? `<span class="bank-card__badge">${badgeLabel}</span>` : '',
  };
}
