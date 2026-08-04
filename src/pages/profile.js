/**
 * דף פרופיל — פרטי משתמש, סיכום חשבון, העדפות ויציאה (דמו).
 */

import { wrapInAppShell } from '../ui/appShell.js';
import { getCurrentProfile } from '../utils/session.js';
import { loadUserPrefs } from '../utils/userPrefs.js';

/**
 * בונה שורת פרט אחת (תווית + ערך).
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function getDetailRowMarkup(label, value) {
  return `
    <li class="profile-details__row">
      <span class="profile-details__label">${label}</span>
      <span class="profile-details__value">${value}</span>
    </li>
  `;
}

/**
 * בונה שורת העדפה עם מתג.
 * @param {{ id: string, setting: string, label: string, checked: boolean }} option
 * @returns {string}
 */
function getPrefRowMarkup({ id, setting, label, checked }) {
  return `
    <button
      id="${id}"
      class="profile-pref"
      type="button"
      role="switch"
      aria-checked="${checked}"
      data-profile-pref="${setting}"
    >
      <span class="profile-pref__label">${label}</span>
      <span class="profile-pref__switch${checked ? ' profile-pref__switch--on' : ''}" aria-hidden="true"></span>
    </button>
  `;
}

/**
 * בונה את תוכן דף הפרופיל (בלי המעטפת).
 * @returns {string}
 */
function getProfileContentMarkup() {
  const prefs = loadUserPrefs();
  const profile = getCurrentProfile();

  if (!profile) {
    return `
      <section class="shell-placeholder" aria-label="פרופיל">
        <h2>אין משתמש מחובר</h2>
        <p>יש להתחבר מחדש.</p>
      </section>
    `;
  }

  return `
    <section class="profile-page" aria-label="פרופיל">
      <header class="profile-hero">
        <div class="profile-hero__avatar" aria-hidden="true">${profile.initials}</div>
        <div class="profile-hero__text">
          <h2 class="profile-hero__name">${profile.fullName}</h2>
          <p class="profile-hero__email">${profile.email}</p>
        </div>
      </header>

      <section class="profile-panel" aria-labelledby="profile-contact-title">
        <h3 id="profile-contact-title" class="profile-panel__title">פרטי קשר</h3>
        <ul class="profile-details">
          ${getDetailRowMarkup('טלפון', profile.phone)}
          ${getDetailRowMarkup('תעודת זהות', profile.idNumberMasked)}
          ${getDetailRowMarkup('כתובת', profile.address)}
        </ul>
      </section>

      <section class="profile-panel" aria-labelledby="profile-account-title">
        <h3 id="profile-account-title" class="profile-panel__title">סיכום חשבון</h3>
        <ul class="profile-details">
          ${getDetailRowMarkup('מספר לקוח', profile.customerNumber)}
          ${getDetailRowMarkup('סניף', `${profile.branchName} (${profile.branchCode})`)}
          ${getDetailRowMarkup('סטטוס', profile.accountStatusLabel)}
        </ul>
      </section>

      <section class="profile-panel" aria-labelledby="profile-prefs-title">
        <h3 id="profile-prefs-title" class="profile-panel__title">העדפות</h3>
        <div class="profile-prefs">
          ${getPrefRowMarkup({
            id: 'profile-pref-hide-balance',
            setting: 'hideBalance',
            label: 'הסתרת יתרה',
            checked: prefs.hideBalance,
          })}
          ${getPrefRowMarkup({
            id: 'profile-pref-hide-loan',
            setting: 'hideLoan',
            label: 'הסתרת פרסומת הלוואה',
            checked: prefs.hideLoan,
          })}
          ${getPrefRowMarkup({
            id: 'profile-pref-notifications',
            setting: 'notifications',
            label: 'התראות (דמו)',
            checked: prefs.notifications,
          })}
        </div>
      </section>

      <div class="profile-actions">
        <button id="profile-logout" class="btn btn-secondary profile-logout" type="button">
          יציאה מהחשבון
        </button>
      </div>
    </section>
  `;
}

/**
 * בונה את דף הפרופיל המלא בתוך המעטפת.
 * @returns {string}
 */
export function getProfileMarkup() {
  return wrapInAppShell({
    activeNav: 'profile',
    title: 'פרופיל',
    content: getProfileContentMarkup(),
  });
}
