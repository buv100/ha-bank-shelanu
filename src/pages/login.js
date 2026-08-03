/**
 * דף התחברות — שלב 1.
 * השדות ויזואליים בלבד; לחיצה על "היכנס" תמיד מעבירה לדף עו״ש נפרד.
 */

import { getBrandMarkup } from '../ui/brand.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { goToAccountPage, PRIVACY_PAGE, TERMS_PAGE } from '../ui/navigation.js';
import { getSiteFooterMarkup } from '../ui/siteFooter.js';
import { getSkipLinkMarkup } from '../ui/skipLink.js';

/**
 * בונה את ה־HTML של מסך ההתחברות.
 * @returns {string}
 */
export function getLoginMarkup() {
  return `
    ${getSkipLinkMarkup()}
    ${getDemoBannerMarkup()}
    <section class="screen screen-login is-active" aria-label="התחברות">
      <div id="main-content" class="login-card" tabindex="-1">
        ${getBrandMarkup({ size: 'md', showTagline: true })}

        <h1 class="login-title">כניסה לחשבון</h1>
        <p class="login-subtitle">דמו למידה — אפשר להיכנס גם בלי למלא פרטים. אין אימות אמיתי.</p>

        <form id="login-form" class="login-form" novalidate>
          <label class="field">
            <span class="field-label">אימייל</span>
            <input
              class="field-input"
              type="email"
              name="email"
              autocomplete="username"
              placeholder="name@example.com"
            />
          </label>

          <label class="field">
            <span class="field-label">סיסמה</span>
            <input
              class="field-input"
              type="password"
              name="password"
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <label class="consent-row">
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

          <button class="btn btn-primary" type="submit">היכנס</button>
        </form>
      </div>
      ${getSiteFooterMarkup()}
    </section>
  `;
}

/**
 * מחבר את אירוע השליחה: מעבר לדף account.html אחרי אישור תנאים (דמו).
 */
export function bindLoginEvents() {
  const form = document.getElementById('login-form');
  const consent = document.getElementById('login-terms-consent');
  const error = document.getElementById('login-consent-error');

  if (!form) {
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

    goToAccountPage();
  });
}
