/**
 * חישובי הלוואה לדמו — מקסימום לפי יתרה, בסכום עגול.
 */

/** כמה פעמים מהיתרה אפשר להציע בהלוואה */
export const LOAN_MULTIPLIER = 3;

/** לאיזה יחידה מעגלים את סכום ההלוואה המקסימלי (אלפים) */
const LOAN_ROUND_TO = 1000;

/**
 * מחשב את סכום ההלוואה המקסימלי: יתרה × מכפיל, מעוגל לאלף הקרוב.
 * @param {number} balance
 * @returns {number}
 */
export function getMaxLoanAmount(balance) {
  const raw = Number(balance) * LOAN_MULTIPLIER;
  return Math.round(raw / LOAN_ROUND_TO) * LOAN_ROUND_TO;
}
