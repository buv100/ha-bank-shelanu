/**
 * הפקדת משכורת אוטומטית —
 * בכל 10 לחודש נכנסת משכורת לכל חשבונות הדמו.
 * כולל catch-up אם הדף היה סגור.
 */

import { mockUsers, findUserById } from '../data/mockUsers.js';
import {
  addTransaction,
  ensureAccountData,
  listTransactions,
} from '../utils/accountStore.js';
import { notifyDataChanged } from './purchaseSimulator.js';

const LIVE_USER_KEY = 'ha-bank-live-user';
const SALARY_DAY = 10;
const MAX_BACKFILL_MONTHS = 6;
const SALARY_DESCRIPTION = 'משכורת';
const SALARY_CATEGORY = 'הכנסה';

/**
 * מחזיר סכום משכורת חודשית למשתמש.
 * @param {string} userId
 * @returns {number}
 */
export function getMonthlySalary(userId) {
  try {
    const raw = window.sessionStorage.getItem(LIVE_USER_KEY);
    const live = raw ? JSON.parse(raw) : null;

    if (live?.id === userId && Number(live.monthlySalary) > 0) {
      return Number(live.monthlySalary);
    }
  } catch {
    // נמשיך ל־mock
  }

  const user = findUserById(userId);

  if (!user) {
    return 0;
  }

  if (Number.isFinite(user.monthlySalary) && user.monthlySalary > 0) {
    return Number(user.monthlySalary);
  }

  const fromSeed = user.transactions?.find((tx) => tx.description === SALARY_DESCRIPTION);
  return Number(fromSeed?.amount) > 0 ? Number(fromSeed.amount) : 0;
}

/**
 * @param {number} year
 * @param {number} month 1-12
 * @returns {string} YYYY-MM-DD
 */
function salaryDateForMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-${String(SALARY_DAY).padStart(2, '0')}`;
}

/**
 * @param {Date} date
 * @returns {{ year: number, month: number }}
 */
function toYearMonth(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

/**
 * חודש קודם.
 * @param {number} year
 * @param {number} month 1-12
 * @returns {{ year: number, month: number }}
 */
function previousMonth(year, month) {
  if (month <= 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

/**
 * האם כבר קיימת משכורת בחודש הזה.
 * @param {string} userId
 * @param {number} year
 * @param {number} month 1-12
 * @returns {boolean}
 */
function hasSalaryForMonth(userId, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return listTransactions(userId).some(
    (tx) => tx.description === SALARY_DESCRIPTION && String(tx.date).startsWith(prefix),
  );
}

/**
 * רשימת חודשים שבהם היה אמור להיות תשלום משכורת עד היום.
 * @param {Date} [now]
 * @returns {Array<{ year: number, month: number }>}
 */
function getDueSalaryMonths(now = new Date()) {
  const today = toYearMonth(now);
  let end = { ...today };

  if (now.getDate() < SALARY_DAY) {
    end = previousMonth(today.year, today.month);
  }

  /** @type {Array<{ year: number, month: number }>} */
  const months = [];
  let cursor = { ...end };

  for (let i = 0; i < MAX_BACKFILL_MONTHS; i += 1) {
    months.push(cursor);
    cursor = previousMonth(cursor.year, cursor.month);
  }

  return months.reverse();
}

/**
 * מפקיד משכורת לחודש אחד אם חסרה.
 * @param {string} userId
 * @param {number} year
 * @param {number} month 1-12
 * @returns {boolean}
 */
function depositSalaryForMonth(userId, year, month) {
  const amount = getMonthlySalary(userId);

  if (amount <= 0) {
    return false;
  }

  ensureAccountData(userId);

  if (hasSalaryForMonth(userId, year, month)) {
    return false;
  }

  const result = addTransaction(userId, {
    date: salaryDateForMonth(year, month),
    description: SALARY_DESCRIPTION,
    amount,
    category: SALARY_CATEGORY,
  });

  return Boolean(result);
}

/**
 * משלים משכורות חסרות למשתמש אחד.
 * @param {string} userId
 * @param {Date} [now]
 * @returns {number} כמה הפקדות נוצרו
 */
export function applyDueSalariesForUser(userId, now = new Date()) {
  if (!userId || getMonthlySalary(userId) <= 0) {
    return 0;
  }

  const months = getDueSalaryMonths(now);
  const toApply = findUserById(userId) ? months : months.slice(-1);
  let created = 0;

  toApply.forEach(({ year, month }) => {
    if (depositSalaryForMonth(userId, year, month)) {
      created += 1;
    }
  });

  return created;
}

/**
 * מחזיר את כל תנועות המשכורת בחשבון, מהחדשה לישנה.
 * @param {string} userId
 * @returns {Array<{ id: string, date: string, description: string, amount: number, category: string }>}
 */
export function listSalaryTransactions(userId) {
  if (!userId) {
    return [];
  }

  ensureAccountData(userId);

  return listTransactions(userId)
    .filter(
      (tx) =>
        tx.description === SALARY_DESCRIPTION && Number(tx.amount) > 0,
    )
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/**
 * מפקיד משכורות לכל חשבונות הדמו (לפי יום ה־10).
 * @param {{ currentUserId?: string | null, now?: Date }} [options]
 * @returns {number}
 */
export function applyDueSalariesForAllAccounts(options = {}) {
  const now = options.now || new Date();
  let total = 0;

  if (options.currentUserId) {
    total += applyDueSalariesForUser(options.currentUserId, now);
  } else {
    mockUsers.forEach((user) => {
      total += applyDueSalariesForUser(user.id, now);
    });
  }

  if (total > 0 && options.currentUserId) {
    notifyDataChanged({ type: 'salary', userId: options.currentUserId });
  }

  return total;
}
