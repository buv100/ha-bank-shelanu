/**
 * אחסון עו״ש לפי משתמש — תנועות ויתרה ב־localStorage.
 * mockUsers הוא זרע ראשוני בלבד; אחר כך אפשר להחליף שכבה זו ב־API/DB
 * בלי לשנות את הממשקים (list / add / update / remove).
 */

import { findUserById } from '../data/mockUsers.js';

const STORAGE_PREFIX = 'ha-bank-account:';

/**
 * @typedef {{ id: string, date: string, description: string, amount: number, category: string }} Transaction
 * @typedef {{ balance: number, currency: string, accountId: string, type: string, transactions: Transaction[] }} AccountData
 */

/**
 * מפתח אחסון למשתמש.
 * @param {string} userId
 * @returns {string}
 */
function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * מעתיק זרע מ־mockUsers למבנה אחסון.
 * @param {string} userId
 * @returns {AccountData | null}
 */
function createSeedFromMock(userId) {
  const user = findUserById(userId);

  if (!user) {
    return null;
  }

  return {
    accountId: user.account.id,
    type: user.account.type,
    currency: user.account.currency,
    balance: user.account.balance,
    transactions: user.transactions.map((tx) => ({ ...tx })),
  };
}

/**
 * קורא נתוני עו״ש מ־localStorage (בלי ליצור זרע).
 * @param {string} userId
 * @returns {AccountData | null}
 */
export function getAccountData(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.transactions)) {
      return null;
    }

    return {
      accountId: parsed.accountId || '',
      type: parsed.type || 'checking',
      currency: parsed.currency || 'ILS',
      balance: Number(parsed.balance) || 0,
      transactions: parsed.transactions,
    };
  } catch {
    return null;
  }
}

/**
 * שומר נתוני עו״ש ל־localStorage.
 * @param {string} userId
 * @param {AccountData} data
 */
export function saveAccountData(userId, data) {
  window.localStorage.setItem(
    storageKey(userId),
    JSON.stringify({
      accountId: data.accountId,
      type: data.type,
      currency: data.currency,
      balance: data.balance,
      transactions: data.transactions,
    }),
  );
}

/**
 * מוודא שיש נתונים למשתמש — אם אין, זורע מ־mockUsers.
 * @param {string} userId
 * @returns {AccountData | null}
 */
export function ensureAccountData(userId) {
  const existing = getAccountData(userId);

  if (existing) {
    return existing;
  }

  const seed = createSeedFromMock(userId);

  if (seed) {
    saveAccountData(userId, seed);
    return seed;
  }

  return existing;
}

/**
 * מזהה ייחודי לתנועה חדשה.
 * @returns {string}
 */
function createTransactionId() {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * מוסיף תנועה ומעדכן יתרה.
 * @param {string} userId
 * @param {{ date: string, description: string, amount: number, category: string }} input
 * @returns {AccountData | null}
 */
export function addTransaction(userId, input) {
  const data = ensureAccountData(userId);

  if (!data) {
    return null;
  }

  const amount = Number(input.amount);

  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }

  const transaction = {
    id: createTransactionId(),
    date: input.date,
    description: String(input.description || '').trim() || 'תנועה',
    amount,
    category: String(input.category || '').trim() || 'כללי',
  };

  data.transactions = [transaction, ...data.transactions];
  data.balance = Number((data.balance + amount).toFixed(2));
  saveAccountData(userId, data);
  return data;
}

/**
 * מעדכן תנועה קיימת ומתקן את היתרה לפי ההפרש.
 * @param {string} userId
 * @param {string} transactionId
 * @param {{ date: string, description: string, amount: number, category: string }} input
 * @returns {AccountData | null}
 */
export function updateTransaction(userId, transactionId, input) {
  const data = ensureAccountData(userId);

  if (!data) {
    return null;
  }

  const index = data.transactions.findIndex((tx) => tx.id === transactionId);

  if (index < 0) {
    return null;
  }

  const nextAmount = Number(input.amount);

  if (!Number.isFinite(nextAmount) || nextAmount === 0) {
    return null;
  }

  const previous = data.transactions[index];
  const delta = nextAmount - previous.amount;

  data.transactions[index] = {
    ...previous,
    date: input.date,
    description: String(input.description || '').trim() || 'תנועה',
    amount: nextAmount,
    category: String(input.category || '').trim() || 'כללי',
  };
  data.balance = Number((data.balance + delta).toFixed(2));
  saveAccountData(userId, data);
  return data;
}

/**
 * מוחק תנועה ומחזיר את הסכום מהיתרה.
 * @param {string} userId
 * @param {string} transactionId
 * @returns {AccountData | null}
 */
export function removeTransaction(userId, transactionId) {
  const data = ensureAccountData(userId);

  if (!data) {
    return null;
  }

  const existing = data.transactions.find((tx) => tx.id === transactionId);

  if (!existing) {
    return null;
  }

  data.transactions = data.transactions.filter((tx) => tx.id !== transactionId);
  data.balance = Number((data.balance - existing.amount).toFixed(2));
  saveAccountData(userId, data);
  return data;
}

/**
 * רשימת תנועות למשתמש (מוכן להחלפה ב־API).
 * @param {string} userId
 * @returns {Transaction[]}
 */
export function listTransactions(userId) {
  return ensureAccountData(userId)?.transactions || [];
}
