/**
 * דף חסכונות — רשימת מוצרים, הפקדה ומשיכה.
 */

import { DATA_CHANGED_EVENT } from '../services/purchaseSimulator.js';
import { wrapInAppShell } from '../ui/appShell.js';
import { TRANSFERS_PAGE } from '../ui/navigation.js';
import { formatCurrency } from '../utils/format.js';
import { getCurrentAccount, getCurrentUserId } from '../utils/session.js';
import {
  depositToSavings,
  ensureSavingsData,
  getTotalSavingsBalance,
  openSavingsAccount,
  withdrawFromSavings,
} from '../utils/savingsStore.js';

/** @typedef {'deposit' | 'withdraw' | 'open'} SavingsPanelMode */

/**
 * @param {import('../utils/savingsStore.js').SavingsAccount} account
 * @returns {string}
 */
function getTypeLabel(account) {
  if (account.type === 'deposit') {
    return 'פיקדון';
  }

  if (account.type === 'kids') {
    return 'חיסכון לילדים';
  }

  return 'חיסכון יומי';
}

/**
 * @param {import('../utils/savingsStore.js').SavingsAccount} account
 * @returns {string}
 */
function getAccountCardMarkup(account) {
  const meta = account.maturityDate
    ? `<p class="savings-card__meta">פדיון: ${account.maturityDate}</p>`
    : `<p class="savings-card__meta">נפתח: ${account.openedAt || '—'}</p>`;

  return `
    <li class="savings-card" data-savings-id="${account.id}">
      <div class="savings-card__head">
        <div>
          <p class="savings-card__type">${getTypeLabel(account)}</p>
          <h3 class="savings-card__name">${account.name}</h3>
        </div>
        <p class="savings-card__balance">${formatCurrency(account.balance)}</p>
      </div>
      ${meta}
      <p class="savings-card__rate">ריבית שנתית: ${account.interestRate.toFixed(1)}%</p>
      <div class="savings-card__actions">
        <button type="button" class="btn btn-secondary savings-card__btn" data-action="deposit" data-savings-id="${account.id}" data-savings-name="${account.name}">
          הפקדה
        </button>
        <button type="button" class="btn btn-secondary savings-card__btn" data-action="withdraw" data-savings-id="${account.id}" data-savings-name="${account.name}">
          משיכה
        </button>
      </div>
    </li>
  `;
}

/**
 * @returns {string}
 */
function getSavingsContentMarkup() {
  const userId = getCurrentUserId();
  const data = userId ? ensureSavingsData(userId) : { accounts: [] };
  const total = getTotalSavingsBalance(data.accounts);
  const checking = getCurrentAccount()?.balance ?? 0;

  const listMarkup = data.accounts.length
    ? `<ul class="savings-list">${data.accounts.map(getAccountCardMarkup).join('')}</ul>`
    : '<p class="savings-empty">עדיין אין חסכונות. פתחו חיסכון ראשון למטה.</p>';

  return `
    <section class="savings-page" aria-label="חסכונות" id="savings-root">
      <div class="savings-hero">
        <p class="savings-hero__caption">סה״כ בחסכונות</p>
        <p id="savings-total" class="savings-hero__balance">${formatCurrency(total)}</p>
        <p class="savings-hero__hint">
          יתרה בעו״ש: <span id="savings-checking">${formatCurrency(checking)}</span>
          · הפקדות ומשיכות מעדכנות גם את העו״ש (דמו).
        </p>
      </div>

      <section aria-labelledby="savings-list-heading">
        <div class="savings-section__head">
          <h2 id="savings-list-heading" class="savings-section__title">החסכונות שלי</h2>
          <button type="button" class="btn btn-primary savings-open-btn" data-action="open">+ חיסכון חדש</button>
        </div>
        <div id="savings-list-wrap">${listMarkup}</div>
      </section>

      <p class="savings-footer-link">
        <a href="${TRANSFERS_PAGE}">להעברות בין חשבונות</a>
      </p>
    </section>

    <div id="savings-panel" class="savings-panel" hidden>
      <div class="savings-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="savings-panel-title">
        <div class="savings-panel__head">
          <div>
            <h2 id="savings-panel-title" class="savings-panel__title"></h2>
            <p id="savings-panel-lead" class="savings-panel__lead"></p>
          </div>
          <button type="button" id="savings-panel-close" class="savings-panel__close" aria-label="סגירה">×</button>
        </div>

        <p id="savings-panel-error" class="consent-error" hidden></p>

        <form id="savings-form" class="savings-form" novalidate></form>
      </div>
    </div>
  `;
}

/**
 * @returns {string}
 */
export function getSavingsMarkup() {
  return wrapInAppShell({
    activeNav: 'savings',
    title: 'חסכונות',
    content: getSavingsContentMarkup(),
  });
}

/**
 * @param {string} message
 */
function showPanelError(message) {
  const error = document.getElementById('savings-panel-error');

  if (!error) {
    return;
  }

  error.hidden = !message;
  error.textContent = message;
}

function closeSavingsPanel() {
  const panel = document.getElementById('savings-panel');

  if (!panel) {
    return;
  }

  panel.hidden = true;
  document.body.style.overflow = '';
  showPanelError('');
}

/**
 * @param {SavingsPanelMode} mode
 * @param {{ savingsId?: string, savingsName?: string }} [context]
 */
function openSavingsPanel(mode, context = {}) {
  const panel = document.getElementById('savings-panel');
  const title = document.getElementById('savings-panel-title');
  const lead = document.getElementById('savings-panel-lead');
  const form = document.getElementById('savings-form');

  if (!panel || !title || !lead || !form) {
    return;
  }

  showPanelError('');

  if (mode === 'open') {
    title.textContent = 'פתיחת חיסכון';
    lead.textContent = 'בחרו מוצר והפקידו סכום ראשוני (אופציונלי).';
    form.innerHTML = `
      <label class="field">
        <span class="field-label">מוצר</span>
        <select class="field-input" name="product" required>
          <option value="">בחרו…</option>
          <option value="daily">חיסכון יומי</option>
          <option value="deposit">פיקדון לשנה</option>
          <option value="kids">חיסכון לילדים</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label">הפקדה ראשונית (₪)</span>
        <input class="field-input" type="number" name="amount" min="0" step="100" placeholder="0" />
      </label>
      <button class="btn btn-primary" type="submit">פתיחה</button>
    `;
  } else {
    const actionLabel = mode === 'deposit' ? 'הפקדה' : 'משיכה';
    title.textContent = `${actionLabel} — ${context.savingsName || 'חיסכון'}`;
    lead.textContent = mode === 'deposit'
      ? 'הסכום יורד מיתרת העו״ש.'
      : 'הסכום יחזור ליתרת העו״ש.';
    form.innerHTML = `
      <label class="field">
        <span class="field-label">סכום (₪)</span>
        <input class="field-input" type="number" name="amount" min="1" step="1" required placeholder="500" />
      </label>
      <button class="btn btn-primary" type="submit">${actionLabel}</button>
    `;
  }

  form.dataset.mode = mode;
  form.dataset.savingsId = context.savingsId || '';
  panel.hidden = false;
  document.body.style.overflow = 'hidden';

  const firstField = form.querySelector('input, select');

  if (firstField instanceof HTMLElement) {
    firstField.focus();
  }
}

/**
 * מרענן את תצוגת החסכונות.
 */
export function refreshSavingsView() {
  const userId = getCurrentUserId();

  if (!userId) {
    return;
  }

  const data = ensureSavingsData(userId);
  const totalEl = document.getElementById('savings-total');
  const checkingEl = document.getElementById('savings-checking');
  const listWrap = document.getElementById('savings-list-wrap');

  if (totalEl) {
    totalEl.textContent = formatCurrency(getTotalSavingsBalance(data.accounts));
  }

  if (checkingEl) {
    checkingEl.textContent = formatCurrency(getCurrentAccount()?.balance ?? 0);
  }

  if (listWrap) {
    listWrap.innerHTML = data.accounts.length
      ? `<ul class="savings-list">${data.accounts.map(getAccountCardMarkup).join('')}</ul>`
      : '<p class="savings-empty">עדיין אין חסכונות. פתחו חיסכון ראשון למטה.</p>';
  }
}

/**
 * מחבר אירועי דף החסכונות.
 */
export function bindSavingsEvents() {
  document.body.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionBtn = target.closest('[data-action]');

    if (!(actionBtn instanceof HTMLElement)) {
      return;
    }

    const action = actionBtn.getAttribute('data-action');

    if (action === 'open') {
      openSavingsPanel('open');
      return;
    }

    if (action === 'deposit' || action === 'withdraw') {
      openSavingsPanel(action, {
        savingsId: actionBtn.getAttribute('data-savings-id') || '',
        savingsName: actionBtn.getAttribute('data-savings-name') || '',
      });
    }
  });

  document.getElementById('savings-panel-close')?.addEventListener('click', closeSavingsPanel);

  document.getElementById('savings-panel')?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.id === 'savings-panel') {
      closeSavingsPanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSavingsPanel();
    }
  });

  document.getElementById('savings-form')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    const userId = getCurrentUserId();

    if (!userId) {
      showPanelError('יש להתחבר מחדש.');
      return;
    }

    const formData = new FormData(form);
    const mode = form.dataset.mode;
    const savingsId = form.dataset.savingsId || '';
    const amount = Number(formData.get('amount') || 0);
    let result;

    if (mode === 'open') {
      result = openSavingsAccount(userId, {
        product: String(formData.get('product') || ''),
        initialAmount: amount,
      });
    } else if (mode === 'deposit') {
      result = depositToSavings(userId, savingsId, amount);
    } else if (mode === 'withdraw') {
      result = withdrawFromSavings(userId, savingsId, amount);
    } else {
      return;
    }

    if (!result.ok) {
      showPanelError(result.error || 'הפעולה נכשלה');
      return;
    }

    closeSavingsPanel();
    refreshSavingsView();
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  });

  window.addEventListener(DATA_CHANGED_EVENT, () => {
    refreshSavingsView();
  });
}
