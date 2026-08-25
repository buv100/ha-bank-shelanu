/**
 * תיקי השקעות לדמו — לפי מזהה משתמש.
 * value = שווי נוכחי; purchaseGainPercent = רווח מצטבר מקנייה (לחישוב עלות).
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   type: string,
 *   value: number,
 *   dailyChangePercent: number,
 *   purchaseGainPercent?: number
 * }} InvestmentHolding
 *
 * @typedef {{
 *   holdings: InvestmentHolding[]
 * }} UserInvestments
 */

/** @type {Record<string, UserInvestments>} */
const mockInvestmentsByUserId = {
  'user-1': {
    holdings: [
      {
        id: 'inv-1a',
        name: 'קרן מחקה S&P 500',
        type: 'קרן סל',
        value: 28500,
        dailyChangePercent: 1.42,
        purchaseGainPercent: 12.4,
      },
      {
        id: 'inv-1b',
        name: 'תעודת זהב',
        type: 'סחורה',
        value: 9200,
        dailyChangePercent: -0.65,
        purchaseGainPercent: -3.2,
      },
      {
        id: 'inv-1c',
        name: 'אג״ח ממשלתי',
        type: 'אג״ח',
        value: 15400,
        dailyChangePercent: 0.18,
        purchaseGainPercent: 2.1,
      },
    ],
  },
  'user-2': {
    holdings: [
      {
        id: 'inv-2a',
        name: 'מדד ת״א 125',
        type: 'קרן סל',
        value: 11200,
        dailyChangePercent: -1.15,
        purchaseGainPercent: 4.5,
      },
      {
        id: 'inv-2b',
        name: 'קרן טכנולוגיה',
        type: 'קרן נאמנות',
        value: 6800,
        dailyChangePercent: 2.05,
        purchaseGainPercent: 18.2,
      },
    ],
  },
  'user-3': {
    holdings: [
      {
        id: 'inv-3a',
        name: 'פיקדון מנוהל',
        type: 'פיקדון',
        value: 4500,
        dailyChangePercent: 0.04,
        purchaseGainPercent: 1.2,
      },
    ],
  },
  'user-4': {
    holdings: [
      {
        id: 'inv-4a',
        name: 'קרן גלובלית',
        type: 'קרן נאמנות',
        value: 22100,
        dailyChangePercent: 0.88,
        purchaseGainPercent: 9.7,
      },
      {
        id: 'inv-4b',
        name: 'מניות בנקים',
        type: 'מניות',
        value: 13450,
        dailyChangePercent: -0.42,
        purchaseGainPercent: -1.8,
      },
      {
        id: 'inv-4c',
        name: 'קרן נדל״ן',
        type: 'קרן סל',
        value: 8750,
        dailyChangePercent: 1.1,
        purchaseGainPercent: 6.4,
      },
    ],
  },
  'user-5': {
    holdings: [
      {
        id: 'inv-5a',
        name: 'קרן אג״ח קונצרני',
        type: 'אג״ח',
        value: 7600,
        dailyChangePercent: -0.22,
        purchaseGainPercent: 0.8,
      },
      {
        id: 'inv-5b',
        name: 'מדד עולמי',
        type: 'קרן סל',
        value: 5400,
        dailyChangePercent: 0.55,
        purchaseGainPercent: 7.3,
      },
    ],
  },
  'user-6': {
    holdings: [
      {
        id: 'inv-6a',
        name: 'תיק מנוהל שמרני',
        type: 'תיק מנוהל',
        value: 41200,
        dailyChangePercent: 0.31,
        purchaseGainPercent: 5.1,
      },
      {
        id: 'inv-6b',
        name: 'מניות צמיחה',
        type: 'מניות',
        value: 19800,
        dailyChangePercent: 1.95,
        purchaseGainPercent: 22.6,
      },
      {
        id: 'inv-6c',
        name: 'דולר / מט״ח',
        type: 'מט״ח',
        value: 6500,
        dailyChangePercent: -0.8,
        purchaseGainPercent: -2.4,
      },
    ],
  },
};

/**
 * מחזיר תיק השקעות גולמי למשתמש, או null.
 * @param {string | null | undefined} userId
 * @returns {UserInvestments | null}
 */
export function getMockInvestmentsForUser(userId) {
  if (!userId) {
    return null;
  }

  return mockInvestmentsByUserId[userId] || null;
}
