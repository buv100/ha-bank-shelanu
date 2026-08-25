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
 * אחוז עם סימן +/− לתצוגה (למשל 1.42 → +1.42%).
 * @param {number} percent
 * @returns {string}
 */
export function formatSignedPercent(percent) {
  const value = Number(percent) || 0;
  const abs = Math.abs(value).toFixed(2);

  if (value > 0) {
    return `+${abs}%`;
  }

  if (value < 0) {
    return `−${abs}%`;
  }

  return `${abs}%`;
}

/**
 * סכום עם סימן +/− (לרווח/הפסד).
 * @param {number} amount
 * @returns {string}
 */
export function formatSignedCurrency(amount) {
  const value = Number(amount) || 0;

  if (value > 0) {
    return `+${formatCurrency(value)}`;
  }

  if (value < 0) {
    return `−${formatCurrency(Math.abs(value))}`;
  }

  return formatCurrency(0);
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
