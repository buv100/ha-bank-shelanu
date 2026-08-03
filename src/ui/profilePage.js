/**
 * קישורי דף הפרופיל — העדפות ויציאה.
 */

import { goToLoginPage } from './navigation.js';
import { applyUserPrefs, setUserPref } from '../utils/userPrefs.js';

/**
 * מעדכן את מראה המתג בשורת העדפה.
 * @param {HTMLElement} button
 * @param {boolean} isOn
 */
function setPrefSwitchState(button, isOn) {
  button.setAttribute('aria-checked', String(isOn));
  const sw = button.querySelector('.profile-pref__switch');

  if (sw) {
    sw.classList.toggle('profile-pref__switch--on', isOn);
  }
}

/**
 * מחבר את מתגי ההעדפות ואת כפתור היציאה בדף הפרופיל.
 */
export function bindProfilePage() {
  const prefsRoot = document.querySelector('.profile-prefs');
  const logoutBtn = document.getElementById('profile-logout');

  prefsRoot?.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest('[data-profile-pref]');

    if (!(button instanceof HTMLElement)) {
      return;
    }

    const key = button.getAttribute('data-profile-pref');

    if (key !== 'hideBalance' && key !== 'hideLoan' && key !== 'notifications') {
      return;
    }

    const next = button.getAttribute('aria-checked') !== 'true';
    setPrefSwitchState(button, next);
    const prefs = setUserPref(key, next);
    applyUserPrefs(prefs);
  });

  logoutBtn?.addEventListener('click', () => {
    goToLoginPage();
  });
}
