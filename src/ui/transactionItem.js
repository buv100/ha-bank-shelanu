/**
 * בניית שורת תנועה אחת ברשימת העו״ש.
 * מופרד מהדף כדי לשמור על קובץ account קצר וברור.
 */

import { formatCurrency, formatDate } from '../utils/format.js';

/**
 * יוצר אלמנט HTML עבור תנועה בודדת.
 * @param {{ id: string, date: string, description: string, amount: number, category: string }} transaction
 * @returns {HTMLElement}
 */
export function createTransactionItem(transaction) {
  const item = document.createElement('li');
  item.className = 'tx-item';
  item.dataset.id = transaction.id;

  const isIncome = transaction.amount > 0;
  const amountClass = isIncome ? 'tx-amount--income' : 'tx-amount--expense';
  // מוסיפים פלוס להכנסה כדי שיהיה ברור במבט ראשון
  const signPrefix = isIncome ? '+' : '';

  item.innerHTML = `
    <div class="tx-main">
      <p class="tx-description">${transaction.description}</p>
      <p class="tx-meta">${formatDate(transaction.date)} · ${transaction.category}</p>
    </div>
    <p class="tx-amount ${amountClass}">${signPrefix}${formatCurrency(transaction.amount)}</p>
  `;

  return item;
}
