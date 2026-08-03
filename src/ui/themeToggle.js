/**
 * כפתור נפרד למצב כהה / בהיר — ליד כפתור ההגדרות.
 */

import { getTheme, toggleTheme } from '../utils/theme.js';

/**
 * בונה את כפתור החלפת ערכת הנושא.
 * @returns {string}
 */
export function getThemeToggleMarkup() {
  const isDark = getTheme() === 'dark';
  const label = isDark ? 'מצב בהיר' : 'מצב כהה';
  const title = isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה';

  return `
    <button
      id="theme-toggle"
      class="theme-toggle"
      type="button"
      title="${title}"
      aria-label="${title}"
      aria-pressed="${isDark}"
    >
      <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6 6 0 0 0 20 14.5z"/>
        </svg>
      </span>
      <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>
        </svg>
      </span>
      <span class="theme-toggle__label">${label}</span>
    </button>
  `;
}

/**
 * מעדכן טקסט ואייקונים לפי ערכת הנושא הנוכחית.
 * @param {HTMLButtonElement} button
 */
function refreshThemeToggle(button) {
  const isDark = getTheme() === 'dark';
  const label = isDark ? 'מצב בהיר' : 'מצב כהה';
  const title = isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה';

  button.setAttribute('aria-pressed', String(isDark));
  button.setAttribute('aria-label', title);
  button.title = title;
  button.classList.toggle('theme-toggle--dark', isDark);

  const labelEl = button.querySelector('.theme-toggle__label');

  if (labelEl) {
    labelEl.textContent = label;
  }
}

/**
 * מחבר לחיצה על כפתור ערכת הנושא.
 */
export function bindThemeToggle() {
  const button = document.getElementById('theme-toggle');

  if (!button) {
    return;
  }

  refreshThemeToggle(button);

  button.addEventListener('click', () => {
    toggleTheme();
    refreshThemeToggle(button);
  });
}
