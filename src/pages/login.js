/**
 * דף התחברות — בחירת משתמש דמו + אישור תנאים.
 */

import { getLoginUserOptions } from '../data/mockUsers.js';
import { getBrandMarkup } from '../ui/brand.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { goToAccountPage, PRIVACY_PAGE, TERMS_PAGE } from '../ui/navigation.js';
import { getSiteFooterMarkup } from '../ui/siteFooter.js';
import { getSkipLinkMarkup } from '../ui/skipLink.js';
import { loginAs } from '../utils/session.js';

/**
 * בונה כרטיס בחירת משתמש אחד.
 * @param {{ id: string, fullName: string, email: string, initials: string }} user
 * @returns {string}
 */
function getUserOptionMarkup(user) {
  return `
    <button
      type="button"
      class="user-pick"
      data-login-user="${user.id}"
    >
      <span class="user-pick__avatar" aria-hidden="true">${user.initials}</span>
      <span class="user-pick__text">
        <span class="user-pick__name">${user.fullName}</span>
        <span class="user-pick__email">${user.email}</span>
      </span>
    </button>
  `;
}

/**
 * בונה את ה־HTML של מסך ההתחברות.
 * @returns {string}
 */
export function getLoginMarkup() {
  const options = getLoginUserOptions().map(getUserOptionMarkup).join('');

  return `
    ${getSkipLinkMarkup()}
    ${getDemoBannerMarkup()}
    <section class="screen screen-login is-active" aria-label="התחברות">
      <div id="main-content" class="login-card" tabindex="-1">
        ${getBrandMarkup({ size: 'md', showTagline: true })}

        <h1 class="login-title">כניסה לחשבון</h1>
        <p class="login-subtitle">דמו למידה — בחרו משתמש. אין אימות אמיתי.</p>

        <label class="consent-row consent-row--login">
          <input id="login-terms-consent" type="checkbox" name="acceptTerms" />
          <span>
            קראתי ואני מסכים/ה ל
            <a href="${TERMS_PAGE}" target="_blank" rel="noopener noreferrer">תנאי השימוש</a>
            ול
            <a href="${PRIVACY_PAGE}" target="_blank" rel="noopener noreferrer">מדיניות הפרטיות</a>
            (דמו)
          </span>
        </label>
        <p id="login-consent-error" class="consent-error" hidden>יש לאשר את תנאי השימוש ומדיניות הפרטיות כדי להמשיך.</p>

        <div class="user-pick-list" role="group" aria-label="בחירת משתמש לדמו">
          ${options}
        </div>
      </div>
      ${getSiteFooterMarkup()}
    </section>
  `;
}

/**
 * מחבר בחירת משתמש + בדיקת הסכמה.
 */
export function bindLoginEvents() {
  const consent = document.getElementById('login-terms-consent');
  const error = document.getElementById('login-consent-error');
  const buttons = document.querySelectorAll('[data-login-user]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (consent && !consent.checked) {
        if (error) {
          error.hidden = false;
        }
        consent?.focus();
        return;
      }

      if (error) {
        error.hidden = true;
      }

      const userId = button.getAttribute('data-login-user');

      if (!userId || !loginAs(userId)) {
        return;
      }

      goToAccountPage();
    });
  });
}
