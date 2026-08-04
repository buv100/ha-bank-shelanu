/**
 * דף עובר ושב — יתרה ותנועות לפי המשתמש המחובר.
 */

import { wrapInAppShell } from '../ui/appShell.js';
import { getLoanFloatMarkup } from '../ui/loanFloat.js';
import { createTransactionItem } from '../ui/transactionItem.js';
import { formatCurrency } from '../utils/format.js';
import {
  getCurrentAccount,
  getCurrentTransactions,
} from '../utils/session.js';

/**
 * בונה את תוכן העו״ש בלבד (בלי המעטפת).
 * @returns {string}
 */
function getAccountContentMarkup() {
  const account = getCurrentAccount();
  const balanceText = account ? formatCurrency(account.balance) : '—';

  return `
    <section class="account-content" aria-label="עובר ושב">
      <div class="account-hero">
        <div class="balance-panel">
          <p class="balance-caption">יתרה זמינה</p>
          <p id="account-balance" class="balance-value">${balanceText}</p>
        </div>
        ${getLoanFloatMarkup()}
      </div>

      <section class="tx-section" aria-labelledby="tx-heading">
        <h2 id="tx-heading" class="tx-heading">תנועות אחרונות</h2>
        <ul id="tx-list" class="tx-list"></ul>
      </section>
    </section>
  `;
}

/**
 * בונה את דף העו״ש המלא בתוך המעטפת.
 * @returns {string}
 */
export function getAccountMarkup() {
  return wrapInAppShell({
    activeNav: 'account',
    title: 'עובר ושב',
    content: getAccountContentMarkup(),
  });
}

/**
 * ממלא את רשימת התנועות מנתוני המשתמש המחובר.
 */
export function renderTransactions() {
  const list = document.getElementById('tx-list');

  if (!list) {
    return;
  }

  list.innerHTML = '';

  getCurrentTransactions().forEach((transaction) => {
    list.appendChild(createTransactionItem(transaction));
  });
}
