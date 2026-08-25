/**
 * דף התחברות / הרשמה מול Supabase — שם משתמש + סיסמה בלבד.
 */

import {
  isSupabaseConfigured,
  signInWithUsername,
  signUpWithUsername,
} from '../services/authApi.js';
import { getBrandMarkup } from '../ui/brand.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { goToAccountPage, PRIVACY_PAGE, SETUP_PAGE, TERMS_PAGE } from '../ui/navigation.js';
import { getSiteFooterMarkup } from '../ui/siteFooter.js';
import { getSkipLinkMarkup } from '../ui/skipLink.js';
import { completeSupabaseLogin, isSetupComplete, restoreSupabaseSession } from '../utils/session.js';

/**
 * @returns {string}
 */
export function getLoginMarkup() {
  const ready = isSupabaseConfigured();

  return `
    ${getSkipLinkMarkup()}
    ${getDemoBannerMarkup()}
    <section class="screen screen-login is-active" aria-label="התחברות">
      <div id="main-content" class="login-card" tabindex="-1">
        ${getBrandMarkup({ size: 'md', showTagline: true })}

        <h1 id="login-title" class="login-title">כניסה לחשבון</h1>
        <p id="login-subtitle" class="login-subtitle">
          ${ready ? 'שם משתמש וסיסמה.' : 'חסר חיבור ל־Supabase ב־.env'}
        </p>

        ${
          ready
            ? `
        <p id="login-form-error" class="consent-error" hidden></p>
        <p id="login-form-ok" class="login-ok" hidden></p>

        <form id="login-signin-form" class="login-form" autocomplete="on">
          <label class="field">
            <span class="field-label">שם משתמש</span>
            <input class="field-input" name="username" required minlength="3" maxlength="32" autocomplete="username" />
          </label>
          <label class="field">
            <span class="field-label">סיסמה</span>
            <input class="field-input" name="password" type="password" required minlength="8" autocomplete="current-password" />
          </label>
          <label class="consent-row consent-row--login">
            <input id="login-terms-consent" type="checkbox" name="acceptTerms" />
            <span>
              קראתי ואני מסכים/ה ל
              <a href="${TERMS_PAGE}" target="_blank" rel="noopener noreferrer">תנאי השימוש</a>
              ול
              <a href="${PRIVACY_PAGE}" target="_blank" rel="noopener noreferrer">מדיניות הפרטיות</a>
            </span>
          </label>
          <button class="btn btn-primary" type="submit">כניסה</button>
        </form>

        <form id="login-signup-form" class="login-form" hidden autocomplete="on">
          <label class="field">
            <span class="field-label">שם מלא</span>
            <input class="field-input" name="fullName" required maxlength="80" autocomplete="name" />
          </label>
          <label class="field">
            <span class="field-label">שם משתמש</span>
            <input class="field-input" name="username" required minlength="3" maxlength="32" pattern="[a-zA-Z0-9._-]+" autocomplete="username" />
          </label>
          <label class="field">
            <span class="field-label">אימייל</span>
            <input class="field-input" name="email" type="email" required autocomplete="email" />
          </label>
          <label class="field">
            <span class="field-label">סיסמה</span>
            <input class="field-input" name="password" type="password" required minlength="8" autocomplete="new-password" />
          </label>
          <label class="consent-row consent-row--login">
            <input id="signup-terms-consent" type="checkbox" name="acceptTerms" />
            <span>מאשר/ת תנאי שימוש ומדיניות פרטיות</span>
          </label>
          <button class="btn btn-primary" type="submit">הרשמה</button>
        </form>

        <p class="login-switch">
          <button type="button" id="login-switch-btn" class="login-switch__btn" data-login-mode="signup">
            אין לך חשבון? הרשמה
          </button>
        </p>
            `
            : '<p class="consent-error">הגדירו VITE_SUPABASE_URL ו־VITE_SUPABASE_ANON_KEY ב־.env</p>'
        }
      </div>
      ${getSiteFooterMarkup()}
    </section>
  `;
}

/**
 * @param {string} message
 * @param {'err' | 'ok'} kind
 */
function showLoginMessage(message, kind) {
  const err = document.getElementById('login-form-error');
  const ok = document.getElementById('login-form-ok');

  if (err) {
    err.hidden = kind !== 'err';
    err.textContent = kind === 'err' ? message : '';
  }

  if (ok) {
    ok.hidden = kind !== 'ok';
    ok.textContent = kind === 'ok' ? message : '';
  }
}

/**
 * @returns {void}
 */
function goToApp() {
  if (!isSetupComplete()) {
    window.location.assign(SETUP_PAGE);
    return;
  }

  goToAccountPage();
}

/**
 * מחבר טפסים ומעביר מחוברים פנימה.
 */
export function bindLoginEvents() {
  restoreSupabaseSession().then((ok) => {
    if (ok) {
      goToApp();
    }
  });

  const signinForm = document.getElementById('login-signin-form');
  const signupForm = document.getElementById('login-signup-form');
  const switchBtn = document.getElementById('login-switch-btn');
  const title = document.getElementById('login-title');
  const subtitle = document.getElementById('login-subtitle');

  /**
   * @param {'signin' | 'signup'} mode
   */
  function showLoginMode(mode) {
    if (signinForm) signinForm.hidden = mode !== 'signin';
    if (signupForm) signupForm.hidden = mode !== 'signup';

    if (title) {
      title.textContent = mode === 'signup' ? 'הרשמה' : 'כניסה לחשבון';
    }

    if (subtitle) {
      subtitle.textContent = mode === 'signup'
        ? 'אחרי הרשמה נכנסים ישר לחשבון.'
        : 'שם משתמש וסיסמה.';
    }

    if (switchBtn) {
      switchBtn.setAttribute('data-login-mode', mode === 'signup' ? 'signin' : 'signup');
      switchBtn.textContent = mode === 'signup'
        ? 'כבר יש חשבון? כניסה'
        : 'אין לך חשבון? הרשמה';
    }

    showLoginMessage('', 'ok');
  }

  switchBtn?.addEventListener('click', () => {
    const next = switchBtn.getAttribute('data-login-mode') === 'signup' ? 'signup' : 'signin';
    showLoginMode(next);
  });

  signinForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const consent = document.getElementById('login-terms-consent');

    if (consent instanceof HTMLInputElement && !consent.checked) {
      showLoginMessage('יש לאשר את תנאי השימוש ומדיניות הפרטיות.', 'err');
      return;
    }

    const form = new FormData(signinForm);
    const result = await signInWithUsername({
      username: String(form.get('username') || ''),
      password: String(form.get('password') || ''),
    });

    if (!result.ok || !result.userId) {
      showLoginMessage(result.error || 'ההתחברות נכשלה', 'err');
      return;
    }

    const ready = await completeSupabaseLogin(result.userId);

    if (!ready) {
      showLoginMessage('התחברתם, אבל הפרופיל עדיין לא מוכן. נסו שוב בעוד רגע.', 'err');
      return;
    }

    goToApp();
  });

  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const consent = document.getElementById('signup-terms-consent');

    if (consent instanceof HTMLInputElement && !consent.checked) {
      showLoginMessage('יש לאשר את תנאי השימוש ומדיניות הפרטיות.', 'err');
      return;
    }

    const form = new FormData(signupForm);
    const result = await signUpWithUsername({
      username: String(form.get('username') || ''),
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
      fullName: String(form.get('fullName') || ''),
    });

    if (!result.ok) {
      showLoginMessage(result.error || 'ההרשמה נכשלה', 'err');
      return;
    }

    if (result.userId) {
      const ready = await completeSupabaseLogin(result.userId, { retries: 6 });

      if (ready) {
        goToApp();
        return;
      }
    }

    showLoginMode('signin');
    showLoginMessage('נרשמתם. היכנסו עם שם המשתמש והסיסמה.', 'ok');
  });
}
