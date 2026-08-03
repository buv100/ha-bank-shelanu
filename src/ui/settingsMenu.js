/**
 * כפתור הגדרות + מיני־תפריט בכותרת העליונה.
 * נפתח בלחיצה; כולל הסתרת יתרה/הלוואה, התראות ויציאה.
 * מצב כהה/בהיר נמצא בכפתור נפרד (themeToggle.js).
 * ההעדפות מסונכרנות עם דף הפרופיל דרך userPrefs.
 */

import { goToLoginPage } from './navigation.js';
import {
  applyUserPrefs,
  loadUserPrefs,
  setUserPref,
} from '../utils/userPrefs.js';

/**
 * בונה את כפתור ההגדרות ואת המיני־תפריט.
 * @returns {string}
 */
export function getSettingsMenuMarkup() {
  const prefs = loadUserPrefs();

  return `
    <div class="settings">
      <button
        id="settings-toggle"
        class="settings__toggle"
        type="button"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls="settings-menu"
        title="הגדרות"
      >
        <span class="settings__icon" aria-hidden="true">
          <!-- אותו סגנון כמו שמש/ירח: 18px, קו stroke 1.8, בלי מילוי -->
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </span>
        <span class="settings__label">הגדרות</span>
      </button>

      <div id="settings-menu" class="settings__menu" hidden role="menu" aria-label="תפריט הגדרות">
        <p class="settings__heading">הגדרות מהירות</p>

        <button
          class="settings__item"
          type="button"
          role="menuitemcheckbox"
          data-setting="hide-balance"
          aria-checked="${prefs.hideBalance}"
        >
          <span>הסתרת יתרה</span>
          <span class="settings__switch${prefs.hideBalance ? ' settings__switch--on' : ''}" aria-hidden="true"></span>
        </button>

        <button
          class="settings__item"
          type="button"
          role="menuitemcheckbox"
          data-setting="hide-loan"
          aria-checked="${prefs.hideLoan}"
        >
          <span>הסתרת פרסומת הלוואה</span>
          <span class="settings__switch${prefs.hideLoan ? ' settings__switch--on' : ''}" aria-hidden="true"></span>
        </button>

        <button
          class="settings__item"
          type="button"
          role="menuitemcheckbox"
          data-setting="notifications"
          aria-checked="${prefs.notifications}"
        >
          <span>התראות (דמו)</span>
          <span class="settings__switch${prefs.notifications ? ' settings__switch--on' : ''}" aria-hidden="true"></span>
        </button>

        <hr class="settings__divider" />

        <button class="settings__item settings__item--danger" type="button" role="menuitem" data-setting="logout">
          יציאה מהחשבון
        </button>
      </div>
    </div>
  `;
}

/**
 * מחליף מצב ויזואלי של מתג בתפריט.
 * @param {HTMLElement} item
 * @param {boolean} isOn
 */
function setSwitchState(item, isOn) {
  item.setAttribute('aria-checked', String(isOn));
  const sw = item.querySelector('.settings__switch');

  if (sw) {
    sw.classList.toggle('settings__switch--on', isOn);
  }
}

/**
 * מחבר פתיחה/סגירה של התפריט ופעולות ההגדרות.
 */
export function bindSettingsMenu() {
  const toggle = document.getElementById('settings-toggle');
  const menu = document.getElementById('settings-menu');

  if (!toggle || !menu) {
    return;
  }

  // מחילים העדפות שמורות על הדף הנוכחי (למשל עו״ש)
  applyUserPrefs();

  /**
   * פותח או סוגר את המיני־תפריט.
   * @param {boolean} open
   */
  function setMenuOpen(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setMenuOpen(menu.hidden);
  });

  // לחיצה מחוץ לתפריט סוגרת אותו
  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (!menu.hidden && !menu.contains(target) && !toggle.contains(target)) {
      setMenuOpen(false);
    }
  });

  menu.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const item = target.closest('[data-setting]');

    if (!(item instanceof HTMLElement)) {
      return;
    }

    // לא נותנים ללחיצה "לברוח" החוצה ולסגור לפני הפעולה
    event.stopPropagation();

    const setting = item.getAttribute('data-setting');

    if (setting === 'logout') {
      goToLoginPage();
      return;
    }

    if (setting === 'hide-balance') {
      const next = item.getAttribute('aria-checked') !== 'true';
      setSwitchState(item, next);
      applyUserPrefs(setUserPref('hideBalance', next));
      return;
    }

    if (setting === 'hide-loan') {
      const next = item.getAttribute('aria-checked') !== 'true';
      setSwitchState(item, next);
      applyUserPrefs(setUserPref('hideLoan', next));
      return;
    }

    if (setting === 'notifications') {
      const next = item.getAttribute('aria-checked') !== 'true';
      setSwitchState(item, next);
      setUserPref('notifications', next);
    }
  });
}
