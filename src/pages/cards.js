/**
 * דף כרטיסים — בחירת כרטיס אחד לתצוגה + פרטים + הצגה מלאה.
 */

import { wrapInAppShell } from '../ui/appShell.js';
import { getBankCardMarkup } from '../ui/bankCard.js';
import { getCardRevealModalsMarkup } from '../ui/cardReveal.js';
import { getCurrentCards } from '../utils/session.js';

/**
 * מחזיר תווית עברית לסוג הכרטיס.
 * @param {string} type
 * @returns {string}
 */
function getTypeLabel(type) {
  return type === 'credit' ? 'אשראי' : 'חיוב';
}

/**
 * בונה שורת פרט אחת ברשימת פרטי הכרטיס.
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function getDetailRowMarkup(label, value) {
  return `
    <li class="card-details__row">
      <span class="card-details__label">${label}</span>
      <span class="card-details__value">${value}</span>
    </li>
  `;
}

/**
 * בונה כפתורי בחירה בין כרטיסים (בלי גלילה בין כולם).
 * @param {string} selectedId
 * @returns {string}
 */
function getCardPickerMarkup(selectedId) {
  const cards = getCurrentCards();

  if (cards.length <= 1) {
    return '';
  }

  const options = cards
    .map((card) => {
      const selected = card.id === selectedId;
      return `
        <button
          type="button"
          class="card-picker__option${selected ? ' is-selected' : ''}"
          role="tab"
          aria-selected="${selected}"
          data-select-card="${card.id}"
        >
          <span class="card-picker__name">${card.productName}</span>
          <span class="card-picker__digits">•••• ${card.lastFour}</span>
        </button>
      `;
    })
    .join('');

  return `
    <div class="card-picker" role="tablist" aria-label="בחירת כרטיס">
      ${options}
    </div>
  `;
}

/**
 * בונה בלוק תצוגה לכרטיס בודד (ויזואלי + פרטים + פעולות).
 * @param {object} card
 * @param {boolean} isSelected
 * @returns {string}
 */
function getSingleCardBlockMarkup(card, isSelected) {
  return `
    <article
      class="cards-page__item"
      data-card-panel="${card.id}"
      aria-labelledby="card-details-title-${card.id}"
      ${isSelected ? '' : 'hidden'}
    >
      <div class="cards-page__visual">
        ${getBankCardMarkup(card)}
      </div>

      <section class="card-details">
        <div class="card-details__head">
          <h2 id="card-details-title-${card.id}" class="card-details__title">${card.productName}</h2>
          <span class="card-status card-status--active">${card.statusLabel}</span>
        </div>

        <ul class="card-details__list">
          ${getDetailRowMarkup('סוג', getTypeLabel(card.type))}
          ${getDetailRowMarkup('מספר כרטיס', card.numberMasked)}
          ${getDetailRowMarkup('תוקף', card.expiry)}
          ${getDetailRowMarkup('בעל הכרטיס', card.holderName)}
          ${getDetailRowMarkup('רשת', card.network)}
          ${getDetailRowMarkup('סטטוס', card.statusLabel)}
        </ul>

        <div class="card-actions">
          <button class="btn btn-primary card-actions__btn" type="button" disabled title="יופעל בהמשך">
            חסימת כרטיס (בקרוב)
          </button>
          <button
            class="btn btn-secondary card-actions__btn card-actions__btn--small"
            type="button"
            data-show-card-details="${card.id}"
          >
            הצגת פרטי כרטיס
          </button>
        </div>
      </section>
    </article>
  `;
}

/**
 * בונה את תוכן דף הכרטיסים (בלי המעטפת).
 * @returns {string}
 */
function getCardsContentMarkup() {
  const cards = getCurrentCards();

  if (cards.length === 0) {
    return `
      <section class="shell-placeholder" aria-label="כרטיסים">
        <h2>אין כרטיסים</h2>
        <p>לא נמצאו כרטיסים להצגה בדמו.</p>
      </section>
    `;
  }

  const selectedId = cards[0].id;

  return `
    <section class="cards-page" aria-label="כרטיסים">
      ${getCardPickerMarkup(selectedId)}
      ${cards.map((card) => getSingleCardBlockMarkup(card, card.id === selectedId)).join('')}
      ${getCardRevealModalsMarkup()}
    </section>
  `;
}

/**
 * בונה את דף הכרטיסים המלא בתוך המעטפת.
 * @returns {string}
 */
export function getCardsMarkup() {
  return wrapInAppShell({
    activeNav: 'cards',
    title: 'כרטיסים',
    content: getCardsContentMarkup(),
  });
}
