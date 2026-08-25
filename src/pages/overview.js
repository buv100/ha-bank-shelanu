/**
 * דף ריכוז יתרות — כמה כסף נשאר באמת (עו״ש − אשראי + השקעות + חסכונות).
 */

import { wrapInAppShell } from '../ui/appShell.js';
import { DATA_CHANGED_EVENT } from '../services/purchaseSimulator.js';
import { getBalancesSummary } from '../utils/balances.js';
import { formatCurrency, formatSignedCurrency, formatSignedPercent } from '../utils/format.js';
import {
  ACCOUNT_PAGE,
  CARDS_PAGE,
  INVESTMENTS_PAGE,
  SAVINGS_PAGE,
} from '../ui/navigation.js';

/**
 * בונה שורת פירוט אחת.
 * @param {string} label
 * @param {string} value
 * @param {string} [extraClass]
 * @returns {string}
 */
function getRowMarkup(label, value, extraClass = '') {
  return `
    <li class="overview-row${extraClass ? ` ${extraClass}` : ''}">
      <span class="overview-row__label">${label}</span>
      <span class="overview-row__value">${value}</span>
    </li>
  `;
}

/**
 * שורת חסכונות עם קישור לדף.
 * @param {import('../utils/balances.js').BalancesSummary} summary
 * @returns {string}
 */
function getSavingsRowMarkup(summary) {
  const countLabel =
    summary.savingsCount > 0
      ? `${summary.savingsCount} מוצרים`
      : 'אין חסכונות';

  return `
    <li class="overview-row overview-row--invest overview-row--plus">
      <span class="overview-row__label overview-row__label--invest">
        <span>חסכונות</span>
        <a class="overview-invest__btn" href="${SAVINGS_PAGE}">
          לחסכונות
          <span class="overview-invest__btn-arrow" aria-hidden="true">←</span>
        </a>
      </span>
      <span class="overview-row__value overview-row__value--stack">
        <span>${formatCurrency(summary.savingsTotal)}</span>
        <span class="overview-change overview-change--flat">${countLabel}</span>
      </span>
    </li>
  `;
}

/**
 * שורת השקעות עם סכום, אחוז יומי וכפתור מעבר.
 * @param {import('../utils/balances.js').BalancesSummary} summary
 * @returns {string}
 */
function getInvestmentsRowMarkup(summary) {
  if (summary.investments == null) {
    return getRowMarkup('השקעות', 'אין תיק', 'overview-row--soon');
  }

  const pct = Number(summary.investmentsDailyChangePercent) || 0;
  const purchasePct = Number(summary.investmentsPurchaseProfitPercent) || 0;
  const changeClass =
    pct > 0
      ? 'overview-change--up'
      : pct < 0
        ? 'overview-change--down'
        : 'overview-change--flat';
  const purchaseClass =
    purchasePct > 0
      ? 'overview-change--up'
      : purchasePct < 0
        ? 'overview-change--down'
        : 'overview-change--flat';

  return `
    <li class="overview-row overview-row--invest">
      <span class="overview-row__label overview-row__label--invest">
        <span>השקעות</span>
        <a class="overview-invest__btn" href="${INVESTMENTS_PAGE}">
          למסחר
          <span class="overview-invest__btn-arrow" aria-hidden="true">←</span>
        </a>
      </span>
      <span class="overview-row__value overview-row__value--stack">
        <span>${formatCurrency(summary.investments)}</span>
        <span class="overview-change ${changeClass}" aria-label="שינוי יומי">
          ${formatSignedPercent(pct)} היום
        </span>
        <span class="overview-change ${purchaseClass}" aria-label="רווח מקנייה">
          מקנייה ${formatSignedCurrency(summary.investmentsPurchaseProfit || 0)}
        </span>
      </span>
    </li>
  `;
}

/**
 * פירוט חובות אשראי לפי כרטיס.
 * @param {import('../utils/balances.js').BalancesSummary} summary
 * @returns {string}
 */
function getCreditBreakdownMarkup(summary) {
  if (summary.creditCards.length === 0) {
    return '<p class="overview-empty">אין כרטיסי אשראי למשתמש זה.</p>';
  }

  const rows = summary.creditCards
    .map((card) => `
      <li class="overview-card-debt">
        <div>
          <p class="overview-card-debt__name">${card.productName}</p>
          <p class="overview-card-debt__meta">•••• ${card.lastFour} · מסגרת ${formatCurrency(card.creditLimit)}</p>
        </div>
        <p class="overview-card-debt__amount">${formatCurrency(card.debt)}</p>
      </li>
    `)
    .join('');

  return `<ul class="overview-card-debt-list">${rows}</ul>`;
}

/**
 * שורות הפירוט המשותפות לרינדור ולרענון.
 * @param {import('../utils/balances.js').BalancesSummary} summary
 * @returns {string}
 */
function getBreakdownRowsMarkup(summary) {
  return `
    ${getRowMarkup('יתרה בעו״ש', formatCurrency(summary.checkingBalance), 'overview-row--plus')}
    ${getRowMarkup('חוב אשראי (סה״כ)', formatCurrency(summary.creditDebt), 'overview-row--minus')}
    ${getSavingsRowMarkup(summary)}
    ${getInvestmentsRowMarkup(summary)}
  `;
}

/**
 * תוכן הדף לפי הסיכום הנוכחי.
 * @returns {string}
 */
function getOverviewContentMarkup() {
  const summary = getBalancesSummary();

  if (!summary) {
    return `
      <section class="shell-placeholder" aria-label="ריכוז יתרות">
        <h2>אין נתונים</h2>
        <p>יש להתחבר מחדש.</p>
      </section>
    `;
  }

  const netClass = summary.netAvailable < 0
    ? ' overview-net--negative'
    : '';

  return `
    <section class="overview-page" aria-label="ריכוז יתרות" id="overview-root">
      <article class="overview-net${netClass}">
        <p class="overview-net__caption">כמה נשאר לך באמת</p>
        <p id="overview-net-value" class="overview-net__value">${formatCurrency(summary.netAvailable)}</p>
        <p class="overview-net__formula">עו״ש − חוב אשראי + חסכונות + השקעות</p>
      </article>

      <section class="overview-panel" aria-labelledby="overview-breakdown-title">
        <h2 id="overview-breakdown-title" class="overview-panel__title">פירוט</h2>
        <ul class="overview-rows" id="overview-rows">
          ${getBreakdownRowsMarkup(summary)}
        </ul>
      </section>

      <section class="overview-panel" aria-labelledby="overview-credit-title">
        <div class="overview-panel__head">
          <h2 id="overview-credit-title" class="overview-panel__title">חוב לפי כרטיס</h2>
          <a class="overview-panel__link" href="${CARDS_PAGE}">לכרטיסים</a>
        </div>
        <div id="overview-credit-breakdown">
          ${getCreditBreakdownMarkup(summary)}
        </div>
      </section>

      <p class="overview-footer-links">
        <a href="${ACCOUNT_PAGE}">לעו״ש</a>
        ·
        <a href="${SAVINGS_PAGE}">לחסכונות</a>
        ·
        <a href="${INVESTMENTS_PAGE}">למסחר</a>
        ·
        <a href="${CARDS_PAGE}">לכרטיסים</a>
      </p>
    </section>
  `;
}

/**
 * בונה את דף הריכוז המלא במעטפת.
 * @returns {string}
 */
export function getOverviewMarkup() {
  return wrapInAppShell({
    activeNav: 'overview',
    title: 'ריכוז יתרות',
    content: getOverviewContentMarkup(),
  });
}

/**
 * מרענן את מספרי הריכוז אחרי שינוי נתונים.
 */
export function refreshOverviewView() {
  const root = document.getElementById('overview-root');

  if (!root) {
    return;
  }

  const summary = getBalancesSummary();

  if (!summary) {
    return;
  }

  const netEl = document.getElementById('overview-net-value');
  const rowsEl = document.getElementById('overview-rows');
  const creditEl = document.getElementById('overview-credit-breakdown');
  const netCard = root.querySelector('.overview-net');
  const formulaEl = root.querySelector('.overview-net__formula');

  if (netEl) {
    netEl.textContent = formatCurrency(summary.netAvailable);
  }

  if (formulaEl) {
    formulaEl.textContent = 'עו״ש − חוב אשראי + חסכונות + השקעות';
  }

  if (netCard) {
    netCard.classList.toggle('overview-net--negative', summary.netAvailable < 0);
  }

  if (rowsEl) {
    rowsEl.innerHTML = getBreakdownRowsMarkup(summary);
  }

  if (creditEl) {
    creditEl.innerHTML = getCreditBreakdownMarkup(summary);
  }
}

/**
 * מאזין לעדכונים אוטומטיים מהסימולטור.
 */
export function bindOverviewLiveUpdates() {
  window.addEventListener(DATA_CHANGED_EVENT, () => {
    refreshOverviewView();
  });
}
