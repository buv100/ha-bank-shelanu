/**
 * עזרי פורמט לתצוגה — כסף ותאריכים בעברית.
 * מופרד מדפי ה־UI כדי שאפשר יהיה להשתמש בו בכל מקום.
 */

/**
 * ממיר מספר לסכום מוצג בשקלים (למשל 15000 → ‏15,000 ₪).
 * @param {number} amount - הסכום המספרי
 * @returns {string} טקסט מוכן לתצוגה
 */
export function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted;
}

/**
 * ממיר תאריך ISO (YYYY-MM-DD) לתצוגה עברית קצרה.
 * @param {string} isoDate - לדוגמה "2026-07-28"
 * @returns {string} תאריך קריא
 */
export function formatDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);

  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
