/**
 * דף עובר ושב — יתרה ותנועות לפי המשתמש המחובר (מתעדכן גם מאוטומציה).
 * כולל חיפוש/סינון וחלון פירוט תנועה בודדת.
 */

import { wrapInAppShell } from '../ui/appShell.js';
import { getLoanFloatMarkup } from '../ui/loanFloat.js';
import { createTransactionItem } from '../ui/transactionItem.js';
import { DATA_CHANGED_EVENT } from '../services/purchaseSimulator.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import { getMaxLoanAmount } from '../utils/loan.js';
import {
  getCurrentAccount,
  getCurrentTransactions,
} from '../utils/session.js';

/** @typedef {{ search: string, category: string, type: 'all' | 'income' | 'expense' }} TransactionFilters */

/** state מקומי של פס הסינון — לא נשמר בין רענוני דף (בכוונה, כמו סינון UI רגיל). */
const filterState = {
  search: '',
  category: '',
  type: 'all',
};

/**
 * מסנן רשימת תנועות לפי חיפוש/קטגוריה/סוג — פונקציה טהורה (בלי DOM).
 * @param {Array<{ description: string, category: string, amount: number }>} transactions
 * @param {TransactionFilters} filters
 * @returns {Array}
 */
export function applyTransactionFilters(transactions, filters) {
  const search = filters.search.trim().toLowerCase();

  return transactions.filter((tx) => {
    if (search && !tx.description.toLowerCase().includes(search)) {
      return false;
    }

    if (filters.category && tx.category !== filters.category) {
      return false;
    }

    if (filters.type === 'income' && tx.amount <= 0) {
      return false;
    }

    if (filters.type === 'expense' && tx.amount >= 0) {
      return false;
    }

    return true;
  });
}

/**
 * @returns {string}
 */
function getFilterBarMarkup() {
  return `
    <div class="tx-filters" role="search" aria-label="חיפוש וסינון תנועות">
      <input
        id="tx-search"
        class="tx-filters__search"
        type="search"
        placeholder="חיפוש לפי תיאור…"
        aria-label="חיפוש תנועות"
      />
      <select id="tx-category-filter" class="tx-filters__select" aria-label="סינון לפי קטגוריה">
        <option value="">כל הקטגוריות</option>
      </select>
      <div class="tx-filters__type" role="group" aria-label="סוג תנועה">
        <button type="button" class="tx-filters__type-btn is-active" data-type="all">הכל</button>
        <button type="button" class="tx-filters__type-btn" data-type="income">הכנסות</button>
        <button type="button" class="tx-filters__type-btn" data-type="expense">הוצאות</button>
      </div>
    </div>
  `;
}

/**
 * @returns {string}
 */
function getTransactionDetailModalMarkup() {
  return `
    <div id="tx-detail-modal" class="tx-detail-modal" hidden>
      <div class="tx-detail-modal__sheet" role="dialog" aria-modal="true" aria-labelledby="tx-detail-title">
        <div class="tx-detail-modal__head">
          <h2 id="tx-detail-title" class="tx-detail-modal__title">פרטי תנועה</h2>
          <button type="button" id="tx-detail-close" class="tx-detail-modal__close" aria-label="סגירה">×</button>
        </div>
        <dl class="tx-detail-list">
          <div class="tx-detail-row">
            <dt>תיאור</dt>
            <dd id="tx-detail-description"></dd>
          </div>
          <div class="tx-detail-row">
            <dt>תאריך</dt>
            <dd id="tx-detail-date"></dd>
          </div>
          <div class="tx-detail-row">
            <dt>קטגוריה</dt>
            <dd id="tx-detail-category"></dd>
          </div>
          <div class="tx-detail-row">
            <dt>סכום</dt>
            <dd id="tx-detail-amount"></dd>
          </div>
        </dl>
      </div>
    </div>
  `;
}

/**
 * בונה את תוכן העו״ש בלבד (בלי המעטפת).
 * @returns {string}
 */
function getAccountContentMarkup() {
  const account = getCurrentAccount();
  const balanceText = account ? formatCurrency(account.balance) : '—';

  return `
    <section class="account-content" aria-label="עובר ושב">
      <div class="account-hero">
        <div class="balance-panel">
          <p class="balance-caption">יתרה זמינה</p>
          <p id="account-balance" class="balance-value">${balanceText}</p>
          <p class="balance-hint">קניות בכרטיס חיוב ומשכורת ב־10 לחודש מתעדכנים אוטומטית</p>
        </div>
        ${getLoanFloatMarkup()}
      </div>

      <section class="tx-section" aria-labelledby="tx-heading">
        <div class="tx-section__head">
          <h2 id="tx-heading" class="tx-heading">תנועות אחרונות</h2>
          <p class="tx-live" aria-live="polite">מתעדכן אוטומטית</p>
        </div>
        ${getFilterBarMarkup()}
        <ul id="tx-list" class="tx-list"></ul>
        <p id="tx-empty" class="tx-empty" hidden>אין תנועות תואמות לסינון.</p>
      </section>
    </section>

    ${getTransactionDetailModalMarkup()}
  `;
}

/**
 * בונה את דף העו״ש המלא בתוך המעטפת.
 * @returns {string}
 */
export function getAccountMarkup() {
  return wrapInAppShell({
    activeNav: 'account',
    title: 'עובר ושב',
    content: getAccountContentMarkup(),
  });
}

/**
 * ממלא את בורר הקטגוריות לפי הקטגוריות הקיימות בפועל, ושומר על הבחירה הנוכחית אם עדיין תקפה.
 * @param {Array<{ category: string }>} transactions
 */
function populateCategoryOptions(transactions) {
  const select = document.getElementById('tx-category-filter');

  if (!(select instanceof HTMLSelectElement)) {
    return;
  }

  const categories = [...new Set(transactions.map((tx) => tx.category))].sort((a, b) =>
    a.localeCompare(b, 'he'),
  );

  const current = select.value;
  select.innerHTML = `
    <option value="">כל הקטגוריות</option>
    ${categories.map((category) => `<option value="${category}">${category}</option>`).join('')}
  `;

  if (categories.includes(current)) {
    select.value = current;
  } else {
    filterState.category = '';
  }
}

/**
 * ממלא את רשימת התנועות מנתוני המשתמש המחובר, לפי הסינון הנוכחי.
 */
export function renderTransactions() {
  const list = document.getElementById('tx-list');
  const empty = document.getElementById('tx-empty');

  if (!list) {
    return;
  }

  const allTransactions = getCurrentTransactions();
  populateCategoryOptions(allTransactions);

  const filtered = applyTransactionFilters(allTransactions, filterState);

  list.innerHTML = '';
  filtered.forEach((transaction) => {
    list.appendChild(createTransactionItem(transaction));
  });

  if (empty) {
    empty.hidden = filtered.length > 0;
  }
}

/**
 * מרענן יתרה, באנר הלוואה ורשימת תנועות.
 */
export function refreshAccountView() {
  const account = getCurrentAccount();
  const balanceEl = document.getElementById('account-balance');
  const loanHeadline = document.getElementById('loan-float-amount');

  if (balanceEl && account) {
    balanceEl.textContent = formatCurrency(account.balance);
  }

  if (loanHeadline && account) {
    loanHeadline.textContent = `עד ${formatCurrency(getMaxLoanAmount(account.balance))}`;
  }

  renderTransactions();
}

/**
 * פותח את חלון פירוט התנועה לפי מזהה.
 * @param {string} transactionId
 */
function openTransactionDetail(transactionId) {
  const transaction = getCurrentTransactions().find((tx) => tx.id === transactionId);
  const modal = document.getElementById('tx-detail-modal');

  if (!transaction || !modal) {
    return;
  }

  const descriptionEl = document.getElementById('tx-detail-description');
  const dateEl = document.getElementById('tx-detail-date');
  const categoryEl = document.getElementById('tx-detail-category');
  const amountEl = document.getElementById('tx-detail-amount');

  if (descriptionEl) descriptionEl.textContent = transaction.description;
  if (dateEl) dateEl.textContent = formatDate(transaction.date);
  if (categoryEl) categoryEl.textContent = transaction.category;

  if (amountEl) {
    amountEl.textContent = formatCurrency(transaction.amount);
    amountEl.classList.toggle('tx-detail-amount--income', transaction.amount > 0);
    amountEl.classList.toggle('tx-detail-amount--expense', transaction.amount < 0);
  }

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeTransactionDetail() {
  const modal = document.getElementById('tx-detail-modal');

  if (!modal) {
    return;
  }

  modal.hidden = true;
  document.body.style.overflow = '';
}

/**
 * מחבר את פס הסינון וחלון פירוט התנועה לאירועי DOM.
 */
export function bindAccountFilters() {
  document.getElementById('tx-search')?.addEventListener('input', (event) => {
    if (event.target instanceof HTMLInputElement) {
      filterState.search = event.target.value;
      renderTransactions();
    }
  });

  document.getElementById('tx-category-filter')?.addEventListener('change', (event) => {
    if (event.target instanceof HTMLSelectElement) {
      filterState.category = event.target.value;
      renderTransactions();
    }
  });

  document.querySelectorAll('.tx-filters__type-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.getAttribute('data-type');

      if (!type) {
        return;
      }

      filterState.type = type;
      document
        .querySelectorAll('.tx-filters__type-btn')
        .forEach((btn) => btn.classList.toggle('is-active', btn === button));
      renderTransactions();
    });
  });

  document.getElementById('tx-list')?.addEventListener('click', (event) => {
    const item = event.target instanceof HTMLElement ? event.target.closest('.tx-item') : null;

    if (item instanceof HTMLElement && item.dataset.id) {
      openTransactionDetail(item.dataset.id);
    }
  });

  document.getElementById('tx-list')?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const item = event.target instanceof HTMLElement ? event.target.closest('.tx-item') : null;

    if (item instanceof HTMLElement && item.dataset.id) {
      event.preventDefault();
      openTransactionDetail(item.dataset.id);
    }
  });

  document.getElementById('tx-detail-close')?.addEventListener('click', closeTransactionDetail);

  document.getElementById('tx-detail-modal')?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.id === 'tx-detail-modal') {
      closeTransactionDetail();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTransactionDetail();
    }
  });
}

/**
 * מאזין לשינויי נתונים מהסימולטור.
 */
export function bindAccountLiveUpdates() {
  window.addEventListener(DATA_CHANGED_EVENT, () => {
    refreshAccountView();
  });
}
