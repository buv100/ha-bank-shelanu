/**
 * דף מסחר ראשי — תיק, מכירה/קנייה על החזקות, מעבר לחיפוש.
 */

import {
  buyInvestment,
  sellInvestment,
  simulateMarketTick,
} from '../utils/investmentStore.js';
import { getInvestmentsSummary } from '../utils/investments.js';
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
} from '../utils/format.js';
import {
  getCurrentAccount,
  getCurrentUserId,
} from '../utils/session.js';
import {
  getInvestmentDetailHref,
  INVESTMENTS_SEARCH_PAGE,
  OVERVIEW_PAGE,
} from '../ui/navigation.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { getInvestChatToggleMarkup } from '../ui/investChatWidget.js';
import { getThemeToggleMarkup } from '../ui/themeToggle.js';
import {
  bindAmountModalActions,
  closeAmountModal,
  consumeBuyFlash,
  getAmountModalMarkup,
  openAmountModal,
  setAmountConfirmHandler,
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
 * @param {import('../utils/investments.js').InvestmentHoldingView} holding
 * @returns {string}
 */
function getHoldingRowMarkup(holding) {
  const dailyClass = getChangeClass(holding.dailyChangePercent);
  const purchaseClass = getChangeClass(holding.purchaseProfitPercent);
  const cash = getCurrentAccount()?.balance || 0;
  const detailHref = getInvestmentDetailHref({ holdingId: holding.id });

  return `
    <li class="mx-row">
      <a class="mx-row__main" href="${detailHref}">
        <div class="mx-row__info">
          <p class="mx-row__title">${holding.name}</p>
          <p class="mx-row__sub">${holding.type} · לפרטים</p>
        </div>
        <div class="mx-row__nums">
          <p class="mx-row__value">${formatCurrency(holding.value)}</p>
          <p class="mx-chg ${dailyClass}">${formatSignedPercent(holding.dailyChangePercent)} היום</p>
          <p class="mx-chg ${purchaseClass}">
            מקנייה ${formatSignedCurrency(holding.purchaseProfit)}
            (${formatSignedPercent(holding.purchaseProfitPercent)})
          </p>
        </div>
      </a>
      <div class="mx-row__actions">
        <button
          type="button"
          class="mx-btn mx-btn--buy"
          data-action="open-buy"
          data-holding-id="${holding.id}"
          data-title="${holding.name}"
          data-max="${cash}"
        >קנה</button>
        <button
          type="button"
          class="mx-btn mx-btn--sell"
          data-action="open-sell"
          data-holding-id="${holding.id}"
          data-title="${holding.name}"
          data-max="${holding.value}"
        >מכור</button>
      </div>
    </li>
  `;
}

/**
 * @returns {string}
 */
export function getInvestmentsContentMarkup() {
  const summary = getInvestmentsSummary() || {
    totalValue: 0,
    purchaseProfit: 0,
    purchaseProfitPercent: 0,
    dailyChangePercent: 0,
    dailyChangeAmount: 0,
    holdings: [],
  };
  const cash = getCurrentAccount()?.balance || 0;
  const dailyClass = getChangeClass(summary.dailyChangePercent);
  const purchaseClass = getChangeClass(summary.purchaseProfitPercent);
  const holdingsMarkup = summary.holdings.length
    ? `<ul class="mx-list">${summary.holdings.map(getHoldingRowMarkup).join('')}</ul>`
    : '<p class="mx-empty">עדיין אין החזקות. חפשו לקנייה למטה.</p>';

  return `
    <div id="investments-root" class="mx-app">
      <section class="mx-summary" aria-label="סיכום">
        <div class="mx-summary__block">
          <p class="mx-label">שווי התיק</p>
          <p class="mx-big">${formatCurrency(summary.totalValue)}</p>
          <p class="mx-chg ${dailyClass}">
            ${formatSignedPercent(summary.dailyChangePercent)} היום
            · ${formatSignedCurrency(summary.dailyChangeAmount)}
          </p>
          <p class="mx-chg ${purchaseClass}">
            רווח מקנייה ${formatSignedCurrency(summary.purchaseProfit)}
            (${formatSignedPercent(summary.purchaseProfitPercent)})
          </p>
        </div>
        <div class="mx-summary__block">
          <p class="mx-label">כסף בעו״ש</p>
          <p class="mx-big mx-big--sm">${formatCurrency(cash)}</p>
        </div>
        <button type="button" class="mx-btn mx-btn--secondary" data-action="tick-market">
          עדכון שוק
        </button>
      </section>

      <section class="mx-card" aria-labelledby="mx-holdings-title">
        <h2 id="mx-holdings-title" class="mx-card__title">ההחזקות שלי</h2>
        ${holdingsMarkup}
      </section>

      <a class="mx-search-card" href="${INVESTMENTS_SEARCH_PAGE}">
        <span class="mx-search-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7"/>
            <path d="M20 20l-3.5-3.5"/>
          </svg>
        </span>
        <span class="mx-search-card__text">
          <span class="mx-search-card__title">חיפוש לקנייה</span>
          <span class="mx-search-card__sub">מצאו מכשיר לפי שם או קטגוריה</span>
        </span>
        <span class="mx-search-card__arrow" aria-hidden="true">←</span>
      </a>

      <p class="mx-note">דמו בלבד — אין מסחר אמיתי.</p>
    </div>
  `;
}

/**
 * @returns {string}
 */
export function getInvestmentsMarkup() {
  return `
    <div class="mx-shell">
      ${getDemoBannerMarkup()}
      <header class="mx-top">
        <div>
          <p class="mx-top__title">מסחר</p>
          <p class="mx-top__sub">התיק שלי</p>
        </div>
        <div class="mx-top__actions">
          ${getInvestChatToggleMarkup()}
          ${getThemeToggleMarkup()}
          <a class="mx-back" href="${OVERVIEW_PAGE}">חזרה לבנק</a>
        </div>
      </header>
      <main id="main-content" class="mx-main">
        ${getInvestmentsContentMarkup()}
      </main>
      ${getAmountModalMarkup()}
      <div class="mx-toast" id="mx-toast" hidden role="status" aria-live="polite"></div>
    </div>
  `;
}

/**
 * מרענן את תוכן התיק.
 */
export function refreshInvestmentsView() {
  const root = document.getElementById('investments-root');

  if (!root?.parentElement) {
    return;
  }

  const temp = document.createElement('div');
  temp.innerHTML = getInvestmentsContentMarkup();
  const next = temp.querySelector('#investments-root');

  if (next) {
    root.replaceWith(next);
  }
}

/**
 * מציג הודעה אם חזרו אחרי קנייה מדף החיפוש.
 */
export function showPendingBuyFlash() {
  const flash = consumeBuyFlash();

  if (!flash) {
    return;
  }

  showMxToast(
    `נוסף לתיק: ${flash.title} · ${formatCurrency(flash.amount)}`,
  );
}

/**
 * מאזין לפעולות בדף התיק.
 */
export function bindInvestmentsActions() {
  setAmountConfirmHandler((trade, amount) => {
    const userId = getCurrentUserId();

    if (!userId) {
      return;
    }

    const result =
      trade.mode === 'buy'
        ? buyInvestment(userId, {
            amount,
            holdingId: trade.holdingId,
            marketId: trade.marketId,
          })
        : sellInvestment(userId, {
            amount,
            holdingId: trade.holdingId || '',
          });

    if (!result.ok) {
      showMxToast(result.error || 'הפעולה נכשלה', 'err');
      return;
    }

    closeAmountModal();
    refreshInvestmentsView();
    showMxToast(trade.mode === 'buy' ? 'הקנייה בוצעה' : 'המכירה בוצעה');
  });

  bindAmountModalActions();

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const btn = target.closest('[data-action]');

    if (!(btn instanceof HTMLElement)) {
      return;
    }

    const action = btn.dataset.action;
    const userId = getCurrentUserId();

    if (!action) {
      return;
    }

    if (action === 'tick-market') {
      if (!userId) return;
      simulateMarketTick(userId);
      refreshInvestmentsView();
      showMxToast('השוק עודכן');
      return;
    }

    if (action === 'open-buy') {
      const maxAmount = Number(btn.dataset.max) || 0;

      if (maxAmount < 50) {
        showMxToast('אין מספיק יתרה בעו״ש', 'err');
        return;
      }

      openAmountModal({
        mode: 'buy',
        holdingId: btn.dataset.holdingId,
        title: btn.dataset.title || 'קנייה',
        maxAmount,
      });
      return;
    }

    if (action === 'open-sell') {
      const holdingId = btn.dataset.holdingId;
      const maxAmount = Number(btn.dataset.max) || 0;

      if (!holdingId || maxAmount < 50) {
        showMxToast('אין סכום מספיק למכירה', 'err');
        return;
      }

      openAmountModal({
        mode: 'sell',
        holdingId,
        title: btn.dataset.title || 'מכירה',
        maxAmount,
      });
    }
  });
}
