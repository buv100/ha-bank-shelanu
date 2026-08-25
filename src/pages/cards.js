/**
 * דף כרטיסים — בחירה, מסגרת/חוב לאשראי, תנועות כרטיס + הצגה מלאה.
 */

import { wrapInAppShell } from '../ui/appShell.js';
import { getBankCardMarkup } from '../ui/bankCard.js';
import { getCardRevealModalsMarkup } from '../ui/cardReveal.js';
import { DATA_CHANGED_EVENT, notifyDataChanged } from '../services/purchaseSimulator.js';
import { setCardBlocked } from '../utils/cardStore.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import { getCurrentCards, getCurrentUserId } from '../utils/session.js';

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
 * שורות מסגרת/חוב לכרטיס אשראי.
 * @param {object} card
 * @returns {string}
 */
function getCreditMetricsMarkup(card) {
  if (card.type !== 'credit') {
    return getDetailRowMarkup('חיוב מעו״ש', 'קניות יורדות ישירות מהיתרה');
  }

  return `
    ${getDetailRowMarkup('מסגרת אשראי', formatCurrency(card.creditLimit || 0))}
    ${getDetailRowMarkup('חוב נוכחי', formatCurrency(card.debt || 0))}
    ${getDetailRowMarkup('אשראי זמין', formatCurrency(card.availableCredit || 0))}
  `;
}

/**
 * רשימת תנועות אחרונות על הכרטיס (אשראי) או הסבר לחיוב.
 * @param {object} card
 * @returns {string}
 */
function getCardActivityMarkup(card) {
  if (card.type === 'debit') {
    return `
      <section class="card-activity" aria-label="פעילות כרטיס חיוב">
        <h3 class="card-activity__title">פעילות</h3>
        <p class="card-activity__note">קניות בכרטיס זה מופיעות אוטומטית בתנועות העו״ש.</p>
      </section>
    `;
  }

  const txs = (card.cardTransactions || []).slice(0, 8);
  const rows = txs.length === 0
    ? '<li class="card-activity__empty">עדיין אין קניות באשראי — הן יופיעו כאן אוטומטית.</li>'
    : txs.map((tx) => `
        <li class="card-activity__item">
          <div>
            <p class="card-activity__desc">${tx.description}</p>
            <p class="card-activity__meta">${formatDate(tx.date)} · ${tx.category}</p>
          </div>
          <p class="card-activity__amount">${formatCurrency(tx.amount)}</p>
        </li>
      `).join('');

  return `
    <section class="card-activity" aria-label="תנועות אשראי" data-card-activity="${card.id}">
      <div class="card-activity__head">
        <h3 class="card-activity__title">תנועות אשראי</h3>
        <p class="card-activity__live">מתעדכן אוטומטית</p>
      </div>
      <ul class="card-activity__list">${rows}</ul>
    </section>
  `;
}

/**
 * בונה כפתורי בחירה בין כרטיסים.
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
      const blockedNote = card.blocked ? ' · חסום' : '';
      return `
        <button
          type="button"
          class="card-picker__option${selected ? ' is-selected' : ''}${card.blocked ? ' is-blocked' : ''}"
          role="tab"
          aria-selected="${selected}"
          data-select-card="${card.id}"
        >
          <span class="card-picker__name">${card.productName}${blockedNote}</span>
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
 * בונה בלוק תצוגה לכרטיס בודד.
 * @param {object} card
 * @param {boolean} isSelected
 * @returns {string}
 */
function getSingleCardBlockMarkup(card, isSelected) {
  const statusClass = card.blocked ? 'card-status--blocked' : 'card-status--active';
  const blockLabel = card.blocked ? 'ביטול חסימה' : 'חסימת כרטיס';
  const blockAction = card.blocked ? 'unblock' : 'block';

  return `
    <article
      class="cards-page__item${card.blocked ? ' cards-page__item--blocked' : ''}"
      data-card-panel="${card.id}"
      aria-labelledby="card-details-title-${card.id}"
      ${isSelected ? '' : 'hidden'}
    >
      <div class="cards-page__visual" data-card-visual="${card.id}">
        ${getBankCardMarkup(card)}
      </div>

      <section class="card-details">
        <div class="card-details__head">
          <h2 id="card-details-title-${card.id}" class="card-details__title">${card.productName}</h2>
          <span class="card-status ${statusClass}" data-card-status="${card.id}">${card.statusLabel}</span>
        </div>

        ${
          card.blocked
            ? '<p class="card-blocked-note" data-card-blocked-note>הכרטיס חסום — לא מתבצעות עליו קניות או חיובים.</p>'
            : ''
        }

        <ul class="card-details__list" data-card-details="${card.id}">
          ${getDetailRowMarkup('סוג', getTypeLabel(card.type))}
          ${getDetailRowMarkup('מספר כרטיס', card.numberMasked)}
          ${getDetailRowMarkup('תוקף', card.expiry)}
          ${getDetailRowMarkup('בעל הכרטיס', card.holderName)}
          ${getDetailRowMarkup('רשת', card.network)}
          ${getDetailRowMarkup('סטטוס', card.statusLabel)}
          ${getCreditMetricsMarkup(card)}
        </ul>

        <div class="card-actions">
          <button
            class="btn ${card.blocked ? 'btn-secondary' : 'btn-primary'} card-actions__btn"
            type="button"
            data-card-block="${card.id}"
            data-block-action="${blockAction}"
          >
            ${blockLabel}
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

      ${getCardActivityMarkup(card)}
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

/**
 * מרענן פרטי אשראי, סטטוס חסימה ותנועות כרטיס בלי לאבד את הבחירה.
 */
export function refreshCardsView() {
  const cards = getCurrentCards();
  const selected = document.querySelector('[data-select-card].is-selected');
  const selectedId = selected?.getAttribute('data-select-card') || cards[0]?.id;

  cards.forEach((card) => {
    const panel = document.querySelector(`[data-card-panel="${card.id}"]`);

    if (panel) {
      panel.classList.toggle('cards-page__item--blocked', Boolean(card.blocked));
    }

    const statusEl = document.querySelector(`[data-card-status="${card.id}"]`);

    if (statusEl) {
      statusEl.textContent = card.statusLabel;
      statusEl.classList.toggle('card-status--blocked', Boolean(card.blocked));
      statusEl.classList.toggle('card-status--active', !card.blocked);
    }

    const detailsSection = panel?.querySelector('.card-details');
    let note = detailsSection?.querySelector('[data-card-blocked-note]');

    if (detailsSection) {
      if (card.blocked && !note) {
        const noteEl = document.createElement('p');
        noteEl.className = 'card-blocked-note';
        noteEl.setAttribute('data-card-blocked-note', '');
        noteEl.textContent =
          'הכרטיס חסום — לא מתבצעות עליו קניות או חיובים.';
        const head = detailsSection.querySelector('.card-details__head');
        head?.after(noteEl);
      } else if (!card.blocked && note) {
        note.remove();
      }
    }

    const blockBtn = document.querySelector(`[data-card-block="${card.id}"]`);

    if (blockBtn instanceof HTMLButtonElement) {
      blockBtn.dataset.blockAction = card.blocked ? 'unblock' : 'block';
      blockBtn.textContent = card.blocked ? 'ביטול חסימה' : 'חסימת כרטיס';
      blockBtn.classList.toggle('btn-primary', !card.blocked);
      blockBtn.classList.toggle('btn-secondary', Boolean(card.blocked));
    }

    const visual = document.querySelector(`[data-card-visual="${card.id}"]`);

    if (visual) {
      visual.innerHTML = getBankCardMarkup(card);
    }

    const picker = document.querySelector(`[data-select-card="${card.id}"]`);

    if (picker) {
      picker.classList.toggle('is-blocked', Boolean(card.blocked));
      const nameEl = picker.querySelector('.card-picker__name');

      if (nameEl) {
        nameEl.textContent = card.blocked
          ? `${card.productName} · חסום`
          : card.productName;
      }
    }

    const details = document.querySelector(`[data-card-details="${card.id}"]`);

    if (details) {
      details.innerHTML = `
        ${getDetailRowMarkup('סוג', getTypeLabel(card.type))}
        ${getDetailRowMarkup('מספר כרטיס', card.numberMasked)}
        ${getDetailRowMarkup('תוקף', card.expiry)}
        ${getDetailRowMarkup('בעל הכרטיס', card.holderName)}
        ${getDetailRowMarkup('רשת', card.network)}
        ${getDetailRowMarkup('סטטוס', card.statusLabel)}
        ${getCreditMetricsMarkup(card)}
      `;
    }

    const activity = document.querySelector(`[data-card-activity="${card.id}"]`);

    if (activity && card.type === 'credit') {
      const parent = activity.parentElement;
      const markup = getCardActivityMarkup(card);
      const temp = document.createElement('div');
      temp.innerHTML = markup.trim();
      const next = temp.firstElementChild;

      if (parent && next) {
        activity.replaceWith(next);
      }
    }
  });

  if (selectedId) {
    document.querySelectorAll('[data-card-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-card-panel') !== selectedId;
    });
  }
}

/**
 * מאזין לכפתורי חסימה / ביטול חסימה.
 */
export function bindCardBlockActions() {
  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const btn = target.closest('[data-card-block]');

    if (!(btn instanceof HTMLElement)) {
      return;
    }

    const cardId = btn.getAttribute('data-card-block');
    const action = btn.getAttribute('data-block-action');
    const userId = getCurrentUserId();

    if (!cardId || !userId) {
      return;
    }

    const shouldBlock = action !== 'unblock';
    const message = shouldBlock
      ? 'לחסום את הכרטיס? לא יתבצעו עליו קניות עד לביטול החסימה.'
      : 'לבטל את חסימת הכרטיס?';

    if (!window.confirm(message)) {
      return;
    }

    const result = setCardBlocked(userId, cardId, shouldBlock);

    if (!result.ok) {
      return;
    }

    notifyDataChanged({ type: 'card-block', userId, cardId, blocked: shouldBlock });
    refreshCardsView();
  });
}

/**
 * מאזין לקניות אוטומטיות ומרענן את הדף.
 */
export function bindCardsLiveUpdates() {
  window.addEventListener(DATA_CHANGED_EVENT, () => {
    refreshCardsView();
  });
}
