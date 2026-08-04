/**
 * דף בקשת הלוואה — טופס פרטים לדמו.
 * לא מופיע בתפריט התחתון; נפתח רק מכפתור "לפרטים" בפרסומת.
 */

import { wrapInAppShell } from '../ui/appShell.js';
import { ACCOUNT_PAGE, PRIVACY_PAGE } from '../ui/navigation.js';
import { formatCurrency } from '../utils/format.js';
import { getMaxLoanAmount } from '../utils/loan.js';
import { getCurrentAccount, getCurrentProfile } from '../utils/session.js';

/**
 * בונה את תוכן טופס ההלוואה.
 * @returns {string}
 */
function getLoanFormMarkup() {
  const account = getCurrentAccount();
  const profile = getCurrentProfile();
  const maxLoanText = formatCurrency(getMaxLoanAmount(account?.balance || 0));
  const namePlaceholder = profile?.fullName || 'ישראל ישראלי';

  return `
    <section class="loan-page" aria-label="בקשת הלוואה">
      <a class="loan-back" href="${ACCOUNT_PAGE}">← חזרה לעו״ש</a>

      <div class="loan-card">
        <h2 class="loan-card__title">בקשת הלוואה</h2>
        <p class="loan-card__lead">
          אפשר לבקש עד <strong>${maxLoanText}</strong> (פי 3 מהיתרה בחשבון).
          השאירו פרטים — נחזור אליכם.
        </p>

        <form id="loan-form" class="loan-form" novalidate>
          <label class="field">
            <span class="field-label">שם מלא</span>
            <input class="field-input" type="text" name="fullName" autocomplete="name" placeholder="${namePlaceholder}" />
          </label>

          <label class="field">
            <span class="field-label">טלפון</span>
            <input class="field-input" type="tel" name="phone" autocomplete="tel" placeholder="050-0000000" />
          </label>

          <label class="field">
            <span class="field-label">אימייל</span>
            <input class="field-input" type="email" name="email" autocomplete="email" placeholder="name@example.com" />
          </label>

          <label class="field">
            <span class="field-label">סכום מבוקש (₪)</span>
            <input class="field-input" type="number" name="amount" min="1" step="100" placeholder="לדוגמה 10000" />
          </label>

          <label class="consent-row">
            <input id="loan-privacy-consent" type="checkbox" name="acceptPrivacy" />
            <span>
              אני מאשר/ת שזה דמו בלבד, וקראתי את
              <a href="${PRIVACY_PAGE}" target="_blank" rel="noopener noreferrer">מדיניות הפרטיות</a>
            </span>
          </label>
          <p id="loan-consent-error" class="consent-error" hidden>יש לאשר את מדיניות הפרטיות לפני שליחה.</p>

          <button class="btn btn-primary" type="submit">שלחו ואחזרו אליי</button>
        </form>

        <p id="loan-success" class="loan-success" hidden>
          תודה! קיבלנו את הפרטים ונחזור אליכם בהקדם.
        </p>
      </div>
    </section>
  `;
}

/**
 * בונה את דף ההלוואה בתוך המעטפת (בלי פרסומת ובלי סימון בתפריט).
 * @returns {string}
 */
export function getLoanMarkup() {
  return wrapInAppShell({
    activeNav: null,
    title: 'הלוואה',
    content: getLoanFormMarkup(),
  });
}

/**
 * מחבר את שליחת הטופס — בדמו רק מציגים הודעת הצלחה (בלי שרת).
 */
export function bindLoanForm() {
  const form = document.getElementById('loan-form');
  const success = document.getElementById('loan-success');
  const consent = document.getElementById('loan-privacy-consent');
  const error = document.getElementById('loan-consent-error');

  if (!form || !success) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (consent && !consent.checked) {
      if (error) {
        error.hidden = false;
      }
      consent.focus();
      return;
    }

    if (error) {
      error.hidden = true;
    }

    form.hidden = true;
    success.hidden = false;
  });
}
