/**
 * כרטיס פרסומת להלוואה — מוצג ליד היתרה בדף העו״ש.
 * לא חלק מהתפריט; נפתח ל־loan.html דרך "לפרטים".
 */

import { mockAccount } from '../data/mockAccount.js';
import { formatCurrency } from '../utils/format.js';
import { getMaxLoanAmount } from '../utils/loan.js';
import { LOAN_PAGE } from './navigation.js';

/**
 * בונה את HTML של כרטיס ההלוואה (שקוף, עם hover כהה יותר).
 * @returns {string}
 */
export function getLoanFloatMarkup() {
  const maxLoanText = formatCurrency(getMaxLoanAmount(mockAccount.balance));

  return `
    <aside class="loan-float" aria-label="פרסומת להלוואה">
      <p class="loan-float__eyebrow">הלוואה</p>
      <p class="loan-float__headline">עד ${maxLoanText}</p>
      <ul class="loan-float__list">
        <li>תשלומים נוחים</li>
        <li>ריבית נמוכה</li>
        <li>אישור מהיר</li>
      </ul>
      <a class="loan-float__btn" href="${LOAN_PAGE}">לפרטים</a>
    </aside>
  `;
}
