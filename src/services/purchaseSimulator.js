/**
 * סימולציית קנייה בכרטיס — אותה לוגיקה לדמו ול־API עתידי.
 * חיוב → יורד מהעו״ש; אשראי → עולה בחוב הכרטיס.
 */

import { addTransaction } from '../utils/accountStore.js';
import { chargeCreditCard, ensureCardsData, getCardRuntime } from '../utils/cardStore.js';

/** אירוע לרענון UI אחרי שינוי נתונים */
export const DATA_CHANGED_EVENT = 'ha-bank:data-changed';

/**
 * מודיע לדפים שיש נתונים חדשים (יתרה / תנועות / חוב).
 * @param {object} [detail]
 */
export function notifyDataChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail }));
}

/**
 * תאריך היום בפורמט ISO לתנועות.
 * @returns {string}
 */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * מדמה קנייה בכרטיס לפי סוג הכרטיס.
 * @param {string} userId
 * @param {{
 *   cardId: string,
 *   amount: number,
 *   description: string,
 *   category?: string,
 *   date?: string
 * }} input
 * @returns {{ ok: boolean, kind?: 'debit' | 'credit', reason?: string }}
 */
export function simulateCardPurchase(userId, input) {
  ensureCardsData(userId);

  const runtime = getCardRuntime(userId, input.cardId);

  if (!runtime) {
    return { ok: false, reason: 'no-card' };
  }

  if (runtime.blocked) {
    return { ok: false, reason: 'blocked' };
  }

  const spend = Math.abs(Number(input.amount));
  const date = input.date || todayIso();
  const description = String(input.description || '').trim() || 'קנייה';
  const category = String(input.category || '').trim() || 'קניות';
  const lastFour = runtime.lastFour || '';
  const label = lastFour ? `${description} (•••• ${lastFour})` : description;

  if (!Number.isFinite(spend) || spend <= 0) {
    return { ok: false, reason: 'bad-amount' };
  }

  if (runtime.type === 'debit') {
    const result = addTransaction(userId, {
      date,
      description: label,
      amount: -spend,
      category,
    });

    if (!result) {
      return { ok: false, reason: 'debit-failed' };
    }

    notifyDataChanged({ userId, kind: 'debit', cardId: input.cardId });
    return { ok: true, kind: 'debit' };
  }

  if (runtime.type === 'credit') {
    const result = chargeCreditCard(userId, input.cardId, {
      date,
      description,
      amount: spend,
      category,
    });

    if (!result.ok) {
      return { ok: false, reason: result.reason || 'credit-failed' };
    }

    notifyDataChanged({ userId, kind: 'credit', cardId: input.cardId });
    return { ok: true, kind: 'credit' };
  }

  return { ok: false, reason: 'unknown-type' };
}
