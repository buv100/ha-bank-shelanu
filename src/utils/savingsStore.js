/**
 * אחסון חסכונות לפי משתמש — localStorage.
 */

import { addTransaction, ensureAccountData, getAccountData, saveAccountData } from './accountStore.js';

const STORAGE_PREFIX = 'ha-bank-savings:';

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   type: 'daily' | 'deposit' | 'kids',
 *   balance: number,
 *   interestRate: number,
 *   openedAt: string,
 *   maturityDate?: string
 * }} SavingsAccount
 * @typedef {{ accounts: SavingsAccount[] }} SavingsData
 */

/**
 * @param {string} userId
 * @returns {string}
 */
function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * @param {string} userId
 * @returns {number}
 */
function seedOffset(userId) {
  let sum = 0;

  for (let i = 0; i < userId.length; i += 1) {
    sum += userId.charCodeAt(i);
  }

  return sum;
}

/**
 * @param {string} userId
 * @returns {SavingsData}
 */
function createDefaultSavings(userId) {
  const offset = seedOffset(userId);

  return {
    accounts: [
      {
        id: 'sav-daily',
        name: 'חיסכון יומי',
        type: 'daily',
        balance: 3200 + (offset % 4000),
        interestRate: 2.5,
        openedAt: '2025-03-10',
      },
      {
        id: 'sav-deposit',
        name: 'פיקדון לשנה',
        type: 'deposit',
        balance: 12000 + (offset % 6000),
        interestRate: 4.2,
        openedAt: '2025-06-01',
        maturityDate: '2026-12-31',
      },
    ],
  };
}

/**
 * @param {string} userId
 * @returns {SavingsData | null}
 */
export function getSavingsData(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.accounts)) {
      return null;
    }

    return {
      accounts: parsed.accounts.map((item) => ({
        id: String(item.id || ''),
        name: String(item.name || 'חיסכון'),
        type: item.type || 'daily',
        balance: Number(item.balance) || 0,
        interestRate: Number(item.interestRate) || 0,
        openedAt: String(item.openedAt || ''),
        maturityDate: item.maturityDate ? String(item.maturityDate) : undefined,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} userId
 * @param {SavingsData} data
 */
export function saveSavingsData(userId, data) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(data));
}

/**
 * @param {string} userId
 * @returns {SavingsData}
 */
export function ensureSavingsData(userId) {
  const existing = getSavingsData(userId);

  if (existing) {
    return existing;
  }

  const seed = createDefaultSavings(userId);
  saveSavingsData(userId, seed);
  return seed;
}

/**
 * @param {SavingsAccount[]} accounts
 * @returns {number}
 */
export function getTotalSavingsBalance(accounts) {
  return accounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
}

/**
 * @returns {string}
 */
function createSavingsId() {
  return `sav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * @param {string} userId
 * @param {{ product: string, initialAmount?: number }} input
 * @returns {{ ok: boolean, error?: string, data?: SavingsData }}
 */
export function openSavingsAccount(userId, input) {
  const data = ensureSavingsData(userId);
  const product = String(input.product || '').trim();
  const amount = Math.max(0, Number(input.initialAmount) || 0);

  const catalog = {
    daily: { name: 'חיסכון יומי', type: 'daily', interestRate: 2.5 },
    deposit: { name: 'פיקדון לשנה', type: 'deposit', interestRate: 4.2, maturityDate: '2026-12-31' },
    kids: { name: 'חיסכון לילדים', type: 'kids', interestRate: 3.1 },
  };

  const meta = catalog[product];

  if (!meta) {
    return { ok: false, error: 'בחרו מוצר חיסכון' };
  }

  if (amount > 0) {
    const account = ensureAccountData(userId);

    if (!account || account.balance < amount) {
      return { ok: false, error: 'אין מספיק יתרה בעו״ש' };
    }

    addTransaction(userId, {
      date: new Date().toISOString().slice(0, 10),
      description: `פתיחת ${meta.name}`,
      amount: -amount,
      category: 'העברה',
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  data.accounts.unshift({
    id: createSavingsId(),
    name: meta.name,
    type: meta.type,
    balance: amount,
    interestRate: meta.interestRate,
    openedAt: today,
    maturityDate: meta.maturityDate,
  });

  saveSavingsData(userId, data);
  return { ok: true, data };
}

/**
 * @param {string} userId
 * @param {string} savingsId
 * @param {number} amount
 * @returns {{ ok: boolean, error?: string, data?: SavingsData }}
 */
export function depositToSavings(userId, savingsId, amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: 'סכום לא תקין' };
  }

  const account = ensureAccountData(userId);

  if (!account || account.balance < value) {
    return { ok: false, error: 'אין מספיק יתרה בעו״ש' };
  }

  const data = ensureSavingsData(userId);
  const savings = data.accounts.find((item) => item.id === savingsId);

  if (!savings) {
    return { ok: false, error: 'חיסכון לא נמצא' };
  }

  savings.balance = Number((savings.balance + value).toFixed(2));

  addTransaction(userId, {
    date: new Date().toISOString().slice(0, 10),
    description: `הפקדה ל${savings.name}`,
    amount: -value,
    category: 'העברה',
  });

  saveSavingsData(userId, data);
  return { ok: true, data };
}

/**
 * @param {string} userId
 * @param {string} savingsId
 * @param {number} amount
 * @returns {{ ok: boolean, error?: string, data?: SavingsData }}
 */
export function withdrawFromSavings(userId, savingsId, amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: 'סכום לא תקין' };
  }

  const data = ensureSavingsData(userId);
  const savings = data.accounts.find((item) => item.id === savingsId);

  if (!savings) {
    return { ok: false, error: 'חיסכון לא נמצא' };
  }

  if (savings.balance < value) {
    return { ok: false, error: 'אין מספיק כסף בחיסכון' };
  }

  if (savings.type === 'deposit' && savings.maturityDate) {
    const today = new Date().toISOString().slice(0, 10);

    if (today < savings.maturityDate) {
      return { ok: false, error: 'פיקדון ניתן למשיכה רק בסוף התקופה (דמו)' };
    }
  }

  savings.balance = Number((savings.balance - value).toFixed(2));

  const checking = getAccountData(userId);

  if (checking) {
    checking.balance = Number((checking.balance + value).toFixed(2));
    checking.transactions.unshift({
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString().slice(0, 10),
      description: `משיכה מ${savings.name}`,
      amount: value,
      category: 'העברה',
    });
    saveAccountData(userId, checking);
  }

  saveSavingsData(userId, data);
  return { ok: true, data };
}
