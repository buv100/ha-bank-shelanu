/**
 * דף העברות — כל אפשרויות העברת הכסף (דמו).
 */

import { DATA_CHANGED_EVENT, notifyDataChanged } from '../services/purchaseSimulator.js';
import { wrapInAppShell } from '../ui/appShell.js';
import { addTransaction } from '../utils/accountStore.js';
import { formatCurrency } from '../utils/format.js';
import { getCurrentAccount, getCurrentUserId } from '../utils/session.js';
import {
  depositToSavings,
  ensureSavingsData,
  openSavingsAccount,
  withdrawFromSavings,
} from '../utils/savingsStore.js';

/** ממפה תווית מוצר חיסכון (בעברית, כמו שמופיע בטופס) למזהה במוצר ב־savingsStore. */
const SAVINGS_PRODUCT_BY_LABEL = {
  'חיסכון יומי': 'daily',
  'פיקדון לשנה': 'deposit',
  'חיסכון לילדים': 'kids',
};

/** @typedef {{ id: string, title: string, desc: string, icon: string, fields: Array<{ name: string, label: string, type?: string, placeholder?: string, required?: boolean, options?: string[] }> }} TransferOption */

/** @type {TransferOption[]} */
const TRANSFER_OPTIONS = [
  {
    id: 'beneficiary',
    title: 'העברה למוטב',
    desc: 'לחשבון בנק בישראל',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="8" r="3"/>
        <path d="M6 19c1.2-2.5 3.2-3.5 6-3.5s4.8 1 6 3.5"/>
        <path d="M16 11h5"/>
        <path d="M19 8v6"/>
      </svg>
    `,
    fields: [
      { name: 'beneficiaryName', label: 'שם המוטב', placeholder: 'ישראל ישראלי', required: true },
      { name: 'bank', label: 'בנק', placeholder: 'הבנק שלנו', required: true },
      { name: 'branch', label: 'סניף', placeholder: '123', required: true },
      { name: 'account', label: 'מספר חשבון', placeholder: '123456', required: true },
      { name: 'amount', label: 'סכום (₪)', type: 'number', placeholder: '500', required: true },
      { name: 'reason', label: 'מהות העברה', placeholder: 'תשלום', required: false },
    ],
  },
  {
    id: 'own',
    title: 'בין חשבונות שלי',
    desc: 'עו״ש, חיסכון, מט״ח',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="3" y="5" width="8" height="14" rx="1.5"/>
        <rect x="13" y="5" width="8" height="14" rx="1.5"/>
        <path d="M11 12h2"/>
        <path d="M12 11v2"/>
      </svg>
    `,
    fields: [
      { name: 'fromAccount', label: 'מחשבון', options: ['עובר ושב', 'חיסכון', 'מט״ח'], required: true },
      { name: 'toAccount', label: 'לחשבון', options: ['עובר ושב', 'חיסכון', 'מט״ח'], required: true },
      { name: 'amount', label: 'סכום (₪)', type: 'number', placeholder: '1000', required: true },
    ],
  },
  {
    id: 'bit',
    title: 'ביט / PayBox',
    desc: 'לפי מספר נייד',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="7" y="2" width="10" height="20" rx="2"/>
        <path d="M11 18h2"/>
        <path d="M10 6h4"/>
      </svg>
    `,
    fields: [
      { name: 'phone', label: 'מספר נייד', type: 'tel', placeholder: '050-1234567', required: true },
      { name: 'amount', label: 'סכום (₪)', type: 'number', placeholder: '120', required: true },
      { name: 'note', label: 'הערה', placeholder: 'אופציונלי', required: false },
    ],
  },
  {
    id: 'fast',
    title: 'העברה מהירה',
    desc: 'זה״ב — באותו יום',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
      </svg>
    `,
    fields: [
      { name: 'beneficiaryName', label: 'שם המוטב', required: true },
      { name: 'account', label: 'מספר חשבון / IBAN', required: true },
      { name: 'amount', label: 'סכום (₪)', type: 'number', required: true },
      { name: 'urgency', label: 'דחיפות', options: ['מיידי', 'עד סוף יום עסקים'], required: true },
    ],
  },
  {
    id: 'international',
    title: 'העברה בינלאומית',
    desc: 'SWIFT / IBAN',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="9"/>
        <path d="M3 12h18"/>
        <path d="M12 3a14 14 0 0 1 0 18"/>
        <path d="M12 3a14 14 0 0 0 0 18"/>
      </svg>
    `,
    fields: [
      { name: 'country', label: 'מדינה', placeholder: 'גרמניה', required: true },
      { name: 'beneficiaryName', label: 'שם המוטב', required: true },
      { name: 'iban', label: 'IBAN / חשבון', required: true },
      { name: 'swift', label: 'SWIFT / BIC', required: true },
      { name: 'amount', label: 'סכום', type: 'number', required: true },
      { name: 'currency', label: 'מטבע', options: ['USD', 'EUR', 'GBP'], required: true },
    ],
  },
  {
    id: 'bills',
    title: 'תשלום חשבונות',
    desc: 'חשמל, מים, ארנונה',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M6 3h12v18H6z"/>
        <path d="M9 7h6"/>
        <path d="M9 11h6"/>
        <path d="M9 15h4"/>
      </svg>
    `,
    fields: [
      { name: 'provider', label: 'ספק / רשות', options: ['חשמל', 'מים', 'ארנונה', 'גז', 'אחר'], required: true },
      { name: 'customerId', label: 'מספר לקוח / חוזה', required: true },
      { name: 'amount', label: 'סכום (₪)', type: 'number', required: true },
    ],
  },
  {
    id: 'savings',
    title: 'הפקדה לחיסכון',
    desc: 'מעו״ש לחיסכון',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M12 3v18"/>
        <path d="M8 7h8"/>
        <path d="M6 12h12"/>
        <path d="M9 17h6"/>
      </svg>
    `,
    fields: [
      { name: 'product', label: 'מוצר חיסכון', options: ['חיסכון יומי', 'פיקדון לשנה', 'חיסכון לילדים'], required: true },
      { name: 'amount', label: 'סכום (₪)', type: 'number', required: true },
    ],
  },
  {
    id: 'standing',
    title: 'העברה חוזרת',
    desc: 'הוראת קבע',
    icon: `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M4 4v5h5"/>
        <path d="M20 20v-5h-5"/>
        <path d="M20 8a8 8 0 0 0-14.5-2"/>
        <path d="M4 16a8 8 0 0 0 14.5 2"/>
      </svg>
    `,
    fields: [
      { name: 'beneficiaryName', label: 'שם המוטב', required: true },
      { name: 'account', label: 'מספר חשבון', required: true },
      { name: 'amount', label: 'סכום (₪)', type: 'number', required: true },
      { name: 'frequency', label: 'תדירות', options: ['חודשי', 'שבועי', 'שנתי'], required: true },
      { name: 'startDate', label: 'תאריך התחלה', type: 'date', required: true },
    ],
  },
];

/**
 * @param {TransferOption} option
 * @returns {string}
 */
function getTileMarkup(option) {
  return `
    <li>
      <button type="button" class="transfers-tile" data-transfer-id="${option.id}">
        <span class="transfers-tile__icon" aria-hidden="true">${option.icon}</span>
        <p class="transfers-tile__title">${option.title}</p>
        <p class="transfers-tile__desc">${option.desc}</p>
      </button>
    </li>
  `;
}

/**
 * @param {TransferOption['fields'][number]} field
 * @returns {string}
 */
function getFieldMarkup(field) {
  const required = field.required ? ' required' : '';
  const type = field.type || 'text';

  if (field.options) {
    const options = field.options
      .map((value) => `<option value="${value}">${value}</option>`)
      .join('');

    return `
      <label class="field">
        <span class="field-label">${field.label}</span>
        <select class="field-input" name="${field.name}"${required}>
          <option value="">בחרו…</option>
          ${options}
        </select>
      </label>
    `;
  }

  return `
    <label class="field">
      <span class="field-label">${field.label}</span>
      <input
        class="field-input"
        type="${type}"
        name="${field.name}"
        ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}${required}
      />
    </label>
  `;
}

/**
 * @returns {string}
 */
function getTransfersContentMarkup() {
  const balance = getCurrentAccount()?.balance ?? 0;

  return `
    <section class="transfers-page" aria-label="העברות">
      <div class="transfers-hero">
        <p class="transfers-hero__caption">יתרה זמינה להעברה</p>
        <p class="transfers-hero__balance">${formatCurrency(balance)}</p>
        <p class="transfers-hero__hint">בחרו סוג העברה. בדמו זה לא מבצע העברה אמיתית — רק מציג טופס לדוגמה.</p>
      </div>

      <section aria-labelledby="transfers-options-heading">
        <h2 id="transfers-options-heading" class="transfers-section__title">אפשרויות העברה</h2>
        <ul class="transfers-grid">
          ${TRANSFER_OPTIONS.map(getTileMarkup).join('')}
        </ul>
      </section>
    </section>

    <div id="transfers-panel" class="transfers-panel" hidden>
      <div class="transfers-panel__sheet" role="dialog" aria-modal="true" aria-labelledby="transfers-panel-title">
        <div class="transfers-panel__head">
          <div>
            <h2 id="transfers-panel-title" class="transfers-panel__title"></h2>
            <p id="transfers-panel-lead" class="transfers-panel__lead"></p>
          </div>
          <button type="button" id="transfers-panel-close" class="transfers-panel__close" aria-label="סגירה">×</button>
        </div>

        <p id="transfers-panel-note" class="transfers-demo-note"></p>
        <p id="transfers-panel-error" class="consent-error" hidden></p>

        <form id="transfers-form" class="transfers-form" novalidate></form>
        <p id="transfers-success" class="transfers-success" hidden></p>
      </div>
    </div>
  `;
}

/**
 * @returns {string}
 */
export function getTransfersMarkup() {
  return wrapInAppShell({
    activeNav: 'transfers',
    title: 'העברות',
    content: getTransfersContentMarkup(),
  });
}

/**
 * @param {TransferOption} option
 */
function openTransferPanel(option) {
  const panel = document.getElementById('transfers-panel');
  const title = document.getElementById('transfers-panel-title');
  const lead = document.getElementById('transfers-panel-lead');
  const note = document.getElementById('transfers-panel-note');
  const form = document.getElementById('transfers-form');
  const success = document.getElementById('transfers-success');

  if (!panel || !title || !lead || !note || !form || !success) {
    return;
  }

  title.textContent = option.title;
  lead.textContent = option.desc;
  note.textContent = option.id === 'standing'
    ? 'הוראת קבע נשמרת כדוגמה בלבד — אין ביצוע חוזר אמיתי ולא משתנה יתרה.'
    : 'הסכום יורד בפועל מיתרת העו״ש שלכם (דמו — בלי חיבור לצד שלישי).';
  form.innerHTML = `
    ${option.fields.map(getFieldMarkup).join('')}
    <button class="btn btn-primary" type="submit">המשך</button>
  `;
  form.hidden = false;
  form.dataset.transferId = option.id;
  success.hidden = true;
  success.textContent = '';
  showTransferPanelError('');
  panel.hidden = false;
  document.body.style.overflow = 'hidden';

  const firstField = form.querySelector('input, select');
  if (firstField instanceof HTMLElement) {
    firstField.focus();
  }
}

/**
 * @param {string} message
 */
function showTransferPanelError(message) {
  const error = document.getElementById('transfers-panel-error');

  if (!error) {
    return;
  }

  error.hidden = !message;
  error.textContent = message;
}

function closeTransferPanel() {
  const panel = document.getElementById('transfers-panel');

  if (!panel) {
    return;
  }

  panel.hidden = true;
  document.body.style.overflow = '';
}

/**
 * מרענן את היתרה המוצגת בראש דף ההעברות.
 */
function refreshTransfersBalance() {
  const el = document.querySelector('.transfers-hero__balance');

  if (el) {
    el.textContent = formatCurrency(getCurrentAccount()?.balance ?? 0);
  }
}

/**
 * מבצע את ההעברה בפועל (עדכון accountStore/savingsStore) לפי סוג הטופס.
 * @param {TransferOption} option
 * @param {HTMLFormElement} form
 * @returns {{ ok: boolean, error?: string, message?: string }}
 */
function performTransfer(option, form) {
  const userId = getCurrentUserId();

  if (!userId) {
    return { ok: false, error: 'יש להתחבר מחדש.' };
  }

  const formData = new FormData(form);
  const today = new Date().toISOString().slice(0, 10);
  const amount = Number(formData.get('amount') || 0);

  // הוראת קבע — נשמרת כדוגמה בלבד, בלי חיוב מיידי
  if (option.id === 'standing') {
    const beneficiaryName = String(formData.get('beneficiaryName') || 'המוטב');
    return {
      ok: true,
      message: `הוראת הקבע ל${beneficiaryName} נשמרה (דמו) — לא מתבצעת העברה אוטומטית.`,
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'סכום לא תקין.' };
  }

  // בין חשבונות שלי — עו"ש <-> חיסכון (מט"ח מחוץ להיקף הדמו)
  if (option.id === 'own') {
    const fromAccount = String(formData.get('fromAccount') || '');
    const toAccount = String(formData.get('toAccount') || '');

    if (!fromAccount || !toAccount || fromAccount === toAccount) {
      return { ok: false, error: 'בחרו שני חשבונות שונים.' };
    }

    if (fromAccount === 'עובר ושב' && toAccount === 'חיסכון') {
      const savingsId = ensureSavingsData(userId).accounts[0]?.id;

      if (!savingsId) {
        return { ok: false, error: 'אין חיסכון פעיל להעברה.' };
      }

      const result = depositToSavings(userId, savingsId, amount);

      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      return { ok: true, message: `הועברו ${formatCurrency(amount)} מעו״ש לחיסכון.` };
    }

    if (fromAccount === 'חיסכון' && toAccount === 'עובר ושב') {
      const savingsId = ensureSavingsData(userId).accounts[0]?.id;

      if (!savingsId) {
        return { ok: false, error: 'אין חיסכון פעיל למשיכה.' };
      }

      const result = withdrawFromSavings(userId, savingsId, amount);

      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      return { ok: true, message: `הועברו ${formatCurrency(amount)} מחיסכון לעו״ש.` };
    }

    return { ok: false, error: 'העברות עם מט״ח יגיעו בגרסה הבאה (דמו).' };
  }

  // הפקדה לחיסכון — לפי מוצר קיים או פתיחת מוצר חדש
  if (option.id === 'savings') {
    const productLabel = String(formData.get('product') || '');
    const productKey = SAVINGS_PRODUCT_BY_LABEL[productLabel];
    const existing = ensureSavingsData(userId).accounts.find((item) => item.type === productKey);

    const result = existing
      ? depositToSavings(userId, existing.id, amount)
      : openSavingsAccount(userId, { product: productKey, initialAmount: amount });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, message: `הופקדו ${formatCurrency(amount)} ל${productLabel}.` };
  }

  // שאר סוגי ההעברה (מוטב / ביט / מהירה / בינלאומית / חשבונות) — חיוב ישיר מהעו"ש
  const account = getCurrentAccount();

  if (!account || account.balance < amount) {
    return { ok: false, error: 'אין מספיק יתרה בעו״ש.' };
  }

  const target =
    String(formData.get('beneficiaryName') || '') ||
    String(formData.get('provider') || '') ||
    String(formData.get('phone') || '') ||
    'המוטב';

  addTransaction(userId, {
    date: today,
    description: `${option.title} — ${target}`,
    amount: -amount,
    category: 'העברה',
  });

  return { ok: true, message: `הועברו ${formatCurrency(amount)} (${option.title}) ל${target}.` };
}

/**
 * מחבר לחיצות על כרטיסי העברה וטפסים.
 */
export function bindTransfersEvents() {
  document.querySelectorAll('[data-transfer-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-transfer-id');
      const option = TRANSFER_OPTIONS.find((item) => item.id === id);

      if (option) {
        openTransferPanel(option);
      }
    });
  });

  document.getElementById('transfers-panel-close')?.addEventListener('click', closeTransferPanel);

  document.getElementById('transfers-panel')?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.id === 'transfers-panel') {
      closeTransferPanel();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTransferPanel();
    }
  });

  document.getElementById('transfers-form')?.addEventListener('submit', (event) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (!form.reportValidity()) {
      return;
    }

    const option = TRANSFER_OPTIONS.find((item) => item.id === form.dataset.transferId);
    const success = document.getElementById('transfers-success');

    if (!option) {
      return;
    }

    const result = performTransfer(option, form);

    if (!result.ok) {
      showTransferPanelError(result.error || 'הפעולה נכשלה.');
      return;
    }

    showTransferPanelError('');

    if (success) {
      success.textContent = result.message || 'הבקשה נקלטה.';
      success.hidden = false;
    }

    form.hidden = true;
    refreshTransfersBalance();
    notifyDataChanged({ userId: getCurrentUserId(), kind: 'transfer' });
  });

  window.addEventListener(DATA_CHANGED_EVENT, () => {
    refreshTransfersBalance();
  });
}
