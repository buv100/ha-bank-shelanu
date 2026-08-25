/**
 * דף חיפוש לקנייה — קטגוריות, חיפוש, ובחירת סכום.
 * הקנייה נשמרת בתיק; התצוגה מתעדכנת בחזרה לדף הראשי.
 */

import { MARKET_INSTRUMENTS } from '../data/mockMarket.js';
import { buyInvestment } from '../utils/investmentStore.js';
import { formatCurrency, formatSignedPercent } from '../utils/format.js';
import {
  getCurrentAccount,
  getCurrentUserId,
} from '../utils/session.js';
import {
  getInvestmentDetailHref,
  INVESTMENTS_PAGE,
} from '../ui/navigation.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { getInvestChatToggleMarkup } from '../ui/investChatWidget.js';
import { getThemeToggleMarkup } from '../ui/themeToggle.js';
import {
  bindAmountModalActions,
  closeAmountModal,
  getAmountModalMarkup,
  openAmountModal,
  setAmountConfirmHandler,
  setBuyFlash,
  showMxToast,
} from '../utils/mxTradeUi.js';

/**
 * @param {number} percent
 * @returns {string}
 */
function getChangeClass(percent) {
  if (percent > 0) return 'mx-chg--up';
  if (percent < 0) return 'mx-chg--down';
  return 'mx-chg--flat';
}

/**
 * @param {string} [query]
 * @returns {string}
 */
function getMarketGroupedMarkup(query = '') {
  const q = query.trim().toLowerCase();
  const filtered = MARKET_INSTRUMENTS.filter((item) => {
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.symbol.toLowerCase().includes(q)
    );
  });

  /** @type {Map<string, typeof MARKET_INSTRUMENTS>} */
  const byType = new Map();

  filtered.forEach((item) => {
    const list = byType.get(item.type) || [];
    list.push(item);
    byType.set(item.type, list);
  });

  if (byType.size === 0) {
    return '<p class="mx-empty">לא נמצאו תוצאות.</p>';
  }

  const cash = getCurrentAccount()?.balance || 0;

  return [...byType.entries()]
    .map(([type, items]) => {
      const rows = items
        .map((item) => {
          const changeClass = getChangeClass(item.dailyChangePercent);
          return `
            <li class="mx-row">
              <a class="mx-row__main" href="${getInvestmentDetailHref({ marketId: item.id })}">
                <div class="mx-row__info">
                  <p class="mx-row__title">${item.name}</p>
                  <p class="mx-row__sub">${item.symbol} · ${formatCurrency(item.unitPrice)} · לפרטים</p>
                </div>
                <div class="mx-row__nums">
                  <p class="mx-chg ${changeClass}">${formatSignedPercent(item.dailyChangePercent)}</p>
                </div>
              </a>
              <div class="mx-row__actions">
                <button
                  type="button"
                  class="mx-btn mx-btn--buy"
                  data-action="open-buy"
                  data-market-id="${item.id}"
                  data-title="${item.name}"
                  data-max="${cash}"
                >קנה</button>
              </div>
            </li>
          `;
        })
        .join('');

      return `
        <section class="mx-card mx-market-group">
          <h2 class="mx-card__title">${type}</h2>
          <ul class="mx-list">${rows}</ul>
        </section>
      `;
    })
    .join('');
}

/**
 * @returns {string}
 */
export function getInvestmentsSearchMarkup() {
  const cash = getCurrentAccount()?.balance || 0;

  return `
    <div class="mx-shell">
      ${getDemoBannerMarkup()}
      <header class="mx-top">
        <div>
          <p class="mx-top__title">חיפוש לקנייה</p>
          <p class="mx-top__sub">זמין בעו״ש: ${formatCurrency(cash)}</p>
        </div>
        <div class="mx-top__actions">
          ${getInvestChatToggleMarkup()}
          ${getThemeToggleMarkup()}
          <a class="mx-back" href="${INVESTMENTS_PAGE}">חזרה לתיק</a>
        </div>
      </header>
      <main id="main-content" class="mx-main">
        <div class="mx-app" id="mx-search-root">
          <label class="mx-field mx-search-field">
            <span>חיפוש</span>
            <input
              id="mx-market-search"
              class="mx-input mx-input--search"
              type="search"
              placeholder="שם, קטגוריה או סימול…"
              autocomplete="off"
            />
          </label>
          <p class="mx-search-hint">בחרו מכשיר, הזינו סכום — והקנייה תופיע בתיק אחרי החזרה.</p>
          <div id="mx-market-results" class="mx-market-results">
            ${getMarketGroupedMarkup('')}
          </div>
        </div>
      </main>
      ${getAmountModalMarkup()}
      <div class="mx-toast" id="mx-toast" hidden role="status" aria-live="polite"></div>
    </div>
  `;
}

/**
 * מאזינים לחיפוש ולקנייה.
 */
export function bindInvestmentsSearchActions() {
  setAmountConfirmHandler((trade, amount) => {
    const userId = getCurrentUserId();

    if (!userId) {
      return;
    }

    const result = buyInvestment(userId, {
      amount,
      marketId: trade.marketId,
    });

    if (!result.ok) {
      showMxToast(result.error || 'הקנייה נכשלה', 'err');
      return;
    }

    setBuyFlash({ title: trade.title, amount });
    closeAmountModal();
    showMxToast('הקנייה נשמרה — חזרו לתיק כדי לראות');

    const cashLabel = document.querySelector('.mx-top__sub');
    const cash = getCurrentAccount()?.balance || 0;

    if (cashLabel) {
      cashLabel.textContent = `זמין בעו״ש: ${formatCurrency(cash)}`;
    }

    const results = document.getElementById('mx-market-results');
    const search = document.getElementById('mx-market-search');

    if (results) {
      results.innerHTML = getMarketGroupedMarkup(
        search instanceof HTMLInputElement ? search.value : '',
      );
    }
  });

  bindAmountModalActions();

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const btn = target.closest('[data-action="open-buy"]');

    if (!(btn instanceof HTMLElement)) {
      return;
    }

    const maxAmount = getCurrentAccount()?.balance || 0;

    if (maxAmount < 50) {
      showMxToast('אין מספיק יתרה בעו״ש', 'err');
      return;
    }

    openAmountModal({
      mode: 'buy',
      marketId: btn.dataset.marketId,
      title: btn.dataset.title || 'קנייה',
      maxAmount,
    });
  });

  document.addEventListener('input', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.id !== 'mx-market-search') {
      return;
    }

    const results = document.getElementById('mx-market-results');

    if (results) {
      results.innerHTML = getMarketGroupedMarkup(target.value);
    }
  });
}
