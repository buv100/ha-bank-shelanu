/**
 * דף ניהול bank-risk-expert — מסך התחברות נפרד (למנהל היחיד, NACHOM) ואז
 * תיבת פקודה חופשית אחת. בכוונה בלי ממשק מורכב: טופס התחברות, ואחריו
 * textarea + כפתור. כל הלוגיקה האמיתית (מי מנהל, אילו כלים מותר להפעיל)
 * נאכפת בשרת (server/bankRiskAgent.js) — הדף הזה הוא רק UI.
 */

import { getBrandMarkup } from '../ui/brand.js';
import { getSkipLinkMarkup } from '../ui/skipLink.js';

const TOKEN_STORAGE_KEY = 'bankRiskAdminToken';

/**
 * @returns {string}
 */
export function getAdminMarkup() {
  return `
    ${getSkipLinkMarkup()}
    <section class="screen screen-admin is-active" aria-label="ניהול סיכונים">
      <div id="main-content" class="admin-card" tabindex="-1">
        ${getBrandMarkup({ size: 'md', showTagline: false })}
        <h1 class="admin-title">bank-risk-expert — ניהול</h1>
        <p class="admin-subtitle">אזור מנהלים בלבד. התחברות נפרדת מהאפליקציה הרגילה.</p>

        <p id="admin-error" class="consent-error" hidden></p>

        <form id="admin-login-form" class="login-form">
          <label class="field">
            <span class="field-label">שם משתמש</span>
            <input class="field-input" name="username" required autocomplete="username" />
          </label>
          <label class="field">
            <span class="field-label">סיסמה</span>
            <input class="field-input" name="password" type="password" required autocomplete="current-password" />
          </label>
          <button class="btn btn-primary" type="submit">כניסה כמנהל</button>
        </form>

        <div id="admin-panel" hidden>
          <p class="admin-panel__hint">
            כתבו פקודה חופשית בעברית — למשל "תחסום את הכרטיס של דני לוי" או
            "תיצור דוח רווח והפסד".
          </p>
          <form id="admin-command-form" class="admin-command-form">
            <textarea
              id="admin-command-input"
              class="admin-command-input"
              rows="3"
              required
              placeholder="הקלידו פקודה…"
            ></textarea>
            <button class="btn btn-primary" type="submit">שלח</button>
          </form>
          <div id="admin-result" class="admin-result" aria-live="polite" hidden></div>
          <button type="button" id="admin-logout" class="admin-logout">התנתקות</button>
        </div>
      </div>
    </section>
  `;
}

/**
 * @param {string} message
 */
function showError(message) {
  const el = document.getElementById('admin-error');
  if (!el) return;
  el.textContent = message;
  el.hidden = !message;
}

/**
 * @param {boolean} loggedIn
 */
function setLoggedInView(loggedIn) {
  const loginForm = document.getElementById('admin-login-form');
  const panel = document.getElementById('admin-panel');
  if (loginForm) loginForm.hidden = loggedIn;
  if (panel) panel.hidden = !loggedIn;
}

/**
 * @param {string} text
 * @param {'ok' | 'error'} kind
 */
function showResult(text, kind) {
  const el = document.getElementById('admin-result');
  if (!el) return;
  el.hidden = false;
  el.textContent = text;
  el.classList.toggle('admin-result--error', kind === 'error');
}

export function bindAdminEvents() {
  const loginForm = document.getElementById('admin-login-form');
  const commandForm = document.getElementById('admin-command-form');
  const logoutBtn = document.getElementById('admin-logout');

  const existingToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (existingToken) {
    setLoggedInView(true);
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');

    const formData = new FormData(loginForm);
    const username = String(formData.get('username') || '');
    const password = String(formData.get('password') || '');

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.token) {
        showError(data.error || 'אין גישה — אזור זה למנהלים בלבד');
        return;
      }

      sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      loginForm.reset();
      setLoggedInView(true);
    } catch {
      showError('שגיאת רשת — ודאו ששרת הפיתוח המקומי (npm run dev) רץ');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  commandForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('admin-command-input'));
    const command = input?.value.trim();
    if (!command) return;

    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setLoggedInView(false);
      return;
    }

    const submitBtn = commandForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    showResult('מריץ את הסוכן…', 'ok');

    try {
      const response = await fetch('/api/admin/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();

      if (response.status === 403) {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setLoggedInView(false);
        showError(data.error || 'תוקף ההתחברות פג — יש להתחבר מחדש');
        return;
      }

      if (!response.ok) {
        showResult(data.error || 'שגיאה בהרצת הסוכן', 'error');
        return;
      }

      showResult(data.reply || '(אין תשובה)', 'ok');
      if (input) input.value = '';
    } catch {
      showResult('שגיאת רשת — ודאו ששרת הפיתוח המקומי (npm run dev) רץ', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setLoggedInView(false);
  });
}
