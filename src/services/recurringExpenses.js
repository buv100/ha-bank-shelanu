/**
 * הוצאות קבועות חודשיות — נשמרות מקומית ומחויבות בעו״ש כמו משכורת.
 */

import {
  addTransaction,
  ensureAccountData,
  listTransactions,
} from '../utils/accountStore.js';
import { notifyDataChanged } from './purchaseSimulator.js';

const STORAGE_PREFIX = 'ha-bank-recurring:';

/**
 * @typedef {{ id: string, description: string, amount: number, category: string, dayOfMonth: number }} RecurringExpense
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
 * @returns {RecurringExpense[]}
 */
export function listRecurringExpenses(userId) {
  if (!userId) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((row) => ({
      id: String(row.id),
      description: String(row.description || ''),
      amount: Number(row.amount) || 0,
      category: String(row.category || 'חשבונות'),
      dayOfMonth: Number(row.dayOfMonth) || 5,
    })).filter((row) => row.description && row.amount > 0);
  } catch {
    return [];
  }
}

/**
 * @param {string} userId
 * @param {RecurringExpense[]} rows
 */
export function saveRecurringExpenses(userId, rows) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}

/**
 * @param {Date} date
 * @returns {{ year: number, month: number, day: number }}
 */
function parts(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * @param {number} year
 * @param {number} month
 * @returns {{ year: number, month: number }}
 */
function previousMonth(year, month) {
  if (month <= 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

/**
 * @param {string} userId
 * @param {RecurringExpense} expense
 * @param {number} year
 * @param {number} month
 * @returns {boolean}
 */
function alreadyPosted(userId, expense, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return listTransactions(userId).some(
    (tx) => tx.description === expense.description && String(tx.date).startsWith(prefix) && tx.amount < 0,
  );
}

/**
 * מחייב הוצאות קבועות שמועדן הגיע.
 * @param {string} userId
 * @param {Date} [now]
 * @returns {number}
 */
export function applyDueRecurringExpenses(userId, now = new Date()) {
  if (!userId) {
    return 0;
  }

  const expenses = listRecurringExpenses(userId);

  if (!expenses.length) {
    return 0;
  }

  ensureAccountData(userId);
  const today = parts(now);
  let created = 0;

  expenses.forEach((expense) => {
    let cursor = { year: today.year, month: today.month };

    for (let i = 0; i < 1; i += 1) {
      const due = cursor.year < today.year
        || (cursor.year === today.year && cursor.month < today.month)
        || (cursor.year === today.year && cursor.month === today.month && today.day >= expense.dayOfMonth);

      if (due && !alreadyPosted(userId, expense, cursor.year, cursor.month)) {
        const posted = addTransaction(userId, {
          date: `${cursor.year}-${String(cursor.month).padStart(2, '0')}-${String(expense.dayOfMonth).padStart(2, '0')}`,
          description: expense.description,
          amount: -Math.abs(expense.amount),
          category: expense.category,
        });

        if (posted) {
          created += 1;
        }
      }

      cursor = previousMonth(cursor.year, cursor.month);
    }
  });

  if (created > 0) {
    notifyDataChanged({ type: 'recurring', userId });
  }

  return created;
}
