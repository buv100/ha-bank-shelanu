/**
 * רכיב תצוגה ויזואלי של כרטיס בנקאי (דמו) — חזית בלבד.
 */

/**
 * בונה HTML של כרטיס פיזי למראה (ממוסך).
 * @param {{
 *   brandName: string,
 *   productName: string,
 *   holderName: string,
 *   numberMasked: string,
 *   expiry: string,
 *   network: string
 * }} card
 * @returns {string}
 */
export function getBankCardMarkup(card) {
  const creditClass = card.type === 'credit' ? ' bank-card--credit' : '';

  return `
    <article class="bank-card bank-card--bold${creditClass}" aria-label="${card.productName}">
      <div class="bank-card__glow" aria-hidden="true"></div>
      <div class="bank-card__shine" aria-hidden="true"></div>
      <div class="bank-card__stripe" aria-hidden="true"></div>

      <div class="bank-card__top">
        <div>
          <p class="bank-card__brand">${card.brandName}</p>
          <p class="bank-card__product">${card.productName}</p>
        </div>
        <p class="bank-card__network">${card.network}</p>
      </div>

      <div class="bank-card__mid">
        <div class="bank-card__chip" aria-hidden="true"></div>
        <span class="bank-card__contactless" aria-hidden="true" title="ללא מגע">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M8.5 8.5c2.2 2.2 2.2 4.8 0 7"/>
            <path d="M11.2 6c3.8 3.5 3.8 8.5 0 12"/>
            <path d="M13.9 3.5c5.2 4.8 5.2 12.2 0 17"/>
          </svg>
        </span>
      </div>

      <p class="bank-card__number">${card.numberMasked}</p>

      <div class="bank-card__bottom">
        <div>
          <p class="bank-card__meta-label">תוקף</p>
          <p class="bank-card__meta-value">${card.expiry}</p>
        </div>
        <div>
          <p class="bank-card__meta-label">בעל הכרטיס</p>
          <p class="bank-card__meta-value">${card.holderName}</p>
        </div>
      </div>
    </article>
  `;
}
