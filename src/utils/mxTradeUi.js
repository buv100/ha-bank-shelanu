/**
 * עזרי UI משותפים לדפי מסחר — טוסט וחלון סכום.
 */

import { formatCurrency } from './format.js';

/** @type {{ mode: 'buy' | 'sell', holdingId?: string, marketId?: string, title: string, maxAmount: number } | null} */
let pendingTrade = null;

/** @type {((trade: NonNullable<typeof pendingTrade>, amount: number) => void) | null} */
let onConfirmHandler = null;

/** @type {number | undefined} */
let toastTimer;

/**
 * @param {string} message
 * @param {'ok' | 'err'} [kind]
 */
export function showMxToast(message, kind = 'ok') {
  const toast = document.getElementById('mx-toast');

  if (!(toast instanceof HTMLElement)) {
    return;
  }

  toast.hidden = false;
  toast.textContent = message;
  toast.classList.toggle('mx-toast--err', kind === 'err');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}

/**
 * @returns {string}
 */
export function getAmountModalMarkup() {
  return `
    <div class="mx-overlay" id="mx-amount-modal" hidden>
      <div class="mx-dialog" role="dialog" aria-modal="true" aria-labelledby="mx-amount-title">
        <h2 id="mx-amount-title" class="mx-dialog__title">בחירת סכום</h2>
        <p class="mx-dialog__sub" id="mx-amount-sub"></p>
        <label class="mx-field">
          <span>סכום (₪)</span>
          <input id="mx-amount-input" class="mx-input" type="number" min="50" step="50" inputmode="decimal" />
        </label>
        <div class="mx-quick" id="mx-amount-quick"></div>
        <p class="mx-dialog__hint" id="mx-amount-hint"></p>
        <div class="mx-dialog__actions">
          <button type="button" class="mx-btn mx-btn--secondary" data-action="close-amount">ביטול</button>
          <button type="button" class="mx-btn mx-btn--buy" data-action="confirm-amount" id="mx-amount-confirm">אישור</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {boolean} open
 */
function setAmountOverlayOpen(open) {
  const overlay = document.getElementById('mx-amount-modal');

  if (!(overlay instanceof HTMLElement)) {
    return;
  }

  overlay.hidden = !open;
  document.body.classList.toggle('mx-modal-open', open);
}

/**
 * @param {{ mode: 'buy' | 'sell', holdingId?: string, marketId?: string, title: string, maxAmount: number }} trade
 */
export function openAmountModal(trade) {
  pendingTrade = trade;
  const titleEl = document.getElementById('mx-amount-title');
  const subEl = document.getElementById('mx-amount-sub');
  const hintEl = document.getElementById('mx-amount-hint');
  const input = document.getElementById('mx-amount-input');
  const quick = document.getElementById('mx-amount-quick');
  const confirmBtn = document.getElementById('mx-amount-confirm');

  if (titleEl) {
    titleEl.textContent = trade.mode === 'buy' ? 'כמה לקנות?' : 'כמה למכור?';
  }

  if (subEl) {
    subEl.textContent = trade.title;
  }

  if (hintEl) {
    hintEl.textContent =
      trade.mode === 'buy'
        ? `מעו״ש · מקסימום ${formatCurrency(trade.maxAmount)} · מינימום ₪50`
        : `מקסימום להחזקה ${formatCurrency(trade.maxAmount)} · מינימום ₪50`;
  }

  if (confirmBtn instanceof HTMLButtonElement) {
    confirmBtn.textContent = trade.mode === 'buy' ? 'קנה' : 'מכור';
    confirmBtn.classList.remove('mx-btn--buy', 'mx-btn--sell');
    confirmBtn.classList.add(trade.mode === 'buy' ? 'mx-btn--buy' : 'mx-btn--sell');
  }

  const presets = [100, 500, 1000]
    .filter((n) => n <= trade.maxAmount)
    .concat(trade.maxAmount >= 50 ? [Math.floor(trade.maxAmount)] : []);
  const uniquePresets = [...new Set(presets)].filter((n) => n >= 50);

  if (quick) {
    quick.innerHTML = uniquePresets
      .map(
        (n) =>
          `<button type="button" class="mx-chip" data-action="set-amount" data-amount="${n}">${formatCurrency(n)}</button>`,
      )
      .join('');
  }

  if (input instanceof HTMLInputElement) {
    input.value = String(Math.min(500, Math.max(50, Math.floor(trade.maxAmount))));
    input.max = String(trade.maxAmount);
  }

  setAmountOverlayOpen(true);
  input?.focus();
  input?.select();
}

export function closeAmountModal() {
  pendingTrade = null;
  setAmountOverlayOpen(false);
}

/**
 * @param {(trade: NonNullable<typeof pendingTrade>, amount: number) => void} handler
 */
export function setAmountConfirmHandler(handler) {
  onConfirmHandler = handler;
}

/**
 * מאזינים לחלון הסכום (פעם אחת לכל דף).
 */
export function bindAmountModalActions() {
  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.id === 'mx-amount-modal' && target.classList.contains('mx-overlay')) {
      closeAmountModal();
      return;
    }

    const btn = target.closest('[data-action]');

    if (!(btn instanceof HTMLElement)) {
      return;
    }

    const action = btn.dataset.action;

    if (action === 'close-amount') {
      closeAmountModal();
      return;
    }

    if (action === 'set-amount') {
      const input = document.getElementById('mx-amount-input');
      const amount = Number(btn.dataset.amount);

      if (input instanceof HTMLInputElement && Number.isFinite(amount)) {
        input.value = String(amount);
        input.focus();
      }
      return;
    }

    if (action === 'confirm-amount') {
      const input = document.getElementById('mx-amount-input');

      if (!pendingTrade || !(input instanceof HTMLInputElement) || !onConfirmHandler) {
        return;
      }

      const amount = Number(input.value);

      if (!Number.isFinite(amount) || amount < 50) {
        showMxToast('סכום מינימום: ₪50', 'err');
        return;
      }

      if (amount > pendingTrade.maxAmount) {
        showMxToast('הסכום גבוה מהמותר', 'err');
        return;
      }

      onConfirmHandler(pendingTrade, amount);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAmountModal();
    }
  });
}

const BUY_FLASH_KEY = 'mx-buy-flash';

/**
 * @param {{ title: string, amount: number }} payload
 */
export function setBuyFlash(payload) {
  window.sessionStorage.setItem(BUY_FLASH_KEY, JSON.stringify(payload));
}

/**
 * @returns {{ title: string, amount: number } | null}
 */
export function consumeBuyFlash() {
  const raw = window.sessionStorage.getItem(BUY_FLASH_KEY);

  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(BUY_FLASH_KEY);

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed.title !== 'string') {
      return null;
    }

    return {
      title: parsed.title,
      amount: Number(parsed.amount) || 0,
    };
  } catch {
    return null;
  }
}
