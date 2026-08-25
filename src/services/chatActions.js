/**
 * פעולות שהצ׳אט יכול לבצע בדמו —
 * ניווט, הצגת כרטיס, והגדרות.
 */

import {
  ACCOUNT_PAGE,
  CARDS_PAGE,
  INVESTMENTS_PAGE,
  LOAN_PAGE,
  OVERVIEW_PAGE,
  PROFILE_PAGE,
  SAVINGS_PAGE,
  TRANSFERS_PAGE,
} from '../ui/navigation.js';
import { selectCard } from '../ui/cardPicker.js';
import { openCardRevealForChat } from '../ui/cardReveal.js';
import {
  applyTheme,
  getTheme,
} from '../utils/theme.js';
import {
  applyUserPrefs,
  setUserPref,
} from '../utils/userPrefs.js';
import { getCurrentCards } from '../utils/session.js';

/**
 * מעדכן מתגי הגדרות/פרופיל אחרי שינוי מהצ׳אט.
 * @param {{ hideBalance: boolean, hideLoan: boolean, notifications: boolean }} prefs
 */
function syncPrefSwitches(prefs) {
  const settingsMap = {
    'hide-balance': prefs.hideBalance,
    'hide-loan': prefs.hideLoan,
    notifications: prefs.notifications,
  };

  Object.entries(settingsMap).forEach(([setting, isOn]) => {
    const item = document.querySelector(`[data-setting="${setting}"]`);

    if (!(item instanceof HTMLElement)) {
      return;
    }

    item.setAttribute('aria-checked', String(isOn));
    item.querySelector('.settings__switch')?.classList.toggle('settings__switch--on', isOn);
  });

  const profileMap = {
    hideBalance: prefs.hideBalance,
    hideLoan: prefs.hideLoan,
    notifications: prefs.notifications,
  };

  Object.entries(profileMap).forEach(([key, isOn]) => {
    const item = document.querySelector(`[data-profile-pref="${key}"]`);

    if (!(item instanceof HTMLElement)) {
      return;
    }

    item.setAttribute('aria-checked', String(isOn));
    item.querySelector('.profile-pref__switch')?.classList.toggle('profile-pref__switch--on', isOn);
  });
}

/**
 * מעדכן את כפתור מצב כהה/בהיר אחרי שינוי מהצ׳אט.
 */
function syncThemeToggleUi() {
  const btn = document.getElementById('theme-toggle');

  if (!(btn instanceof HTMLElement)) {
    return;
  }

  const isDark = getTheme() === 'dark';
  const label = isDark ? 'מצב בהיר' : 'מצב כהה';
  const title = isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה';
  btn.classList.toggle('theme-toggle--dark', isDark);
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label', title);
  btn.setAttribute('title', title);
  const labelEl = btn.querySelector('.theme-toggle__label');

  if (labelEl) {
    labelEl.textContent = label;
  }
}

/**
 * בוחר כרטיס לפי טקסט או ברירת מחדל (ראשון).
 * @param {string | undefined} hint
 * @returns {string | undefined}
 */
function resolveCardId(hint) {
  const cards = getCurrentCards();

  if (!hint) {
    return cards[0]?.id;
  }

  const lower = hint.toLowerCase();

  if (/אשראי|credit/.test(lower)) {
    return cards.find((c) => c.type === 'credit')?.id || cards[0]?.id;
  }

  if (/חיוב|debit/.test(lower)) {
    return cards.find((c) => c.type === 'debit')?.id || cards[0]?.id;
  }

  return cards[0]?.id;
}

/**
 * מריץ פעולה שהוחזרה מהבוט.
 * @param {string | undefined} action
 * @param {{ message?: string, cardId?: string }} [meta]
 */
export function runChatAction(action, meta = {}) {
  if (!action) {
    return;
  }

  const routes = {
    navigate_account: ACCOUNT_PAGE,
    navigate_cards: CARDS_PAGE,
    navigate_profile: PROFILE_PAGE,
    navigate_loan: LOAN_PAGE,
    navigate_overview: OVERVIEW_PAGE,
    navigate_investments: INVESTMENTS_PAGE,
    navigate_savings: SAVINGS_PAGE,
    navigate_transfers: TRANSFERS_PAGE,
  };

  if (routes[action]) {
    window.setTimeout(() => {
      window.location.assign(routes[action]);
    }, 650);
    return;
  }

  if (action === 'reveal_card' || action === 'show_card_details') {
    const cardId = meta.cardId || resolveCardId(meta.message);

    if (document.getElementById('card-reveal-modal')) {
      if (cardId) {
        selectCard(cardId);
      }
      openCardRevealForChat(cardId);
      return;
    }

    const target = `${CARDS_PAGE}?reveal=${encodeURIComponent(cardId || 'card-1')}`;
    window.setTimeout(() => {
      window.location.assign(target);
    }, 650);
    return;
  }

  if (action === 'hide_balance') {
    const prefs = setUserPref('hideBalance', true);
    applyUserPrefs(prefs);
    syncPrefSwitches(prefs);
    return;
  }

  if (action === 'show_balance') {
    const prefs = setUserPref('hideBalance', false);
    applyUserPrefs(prefs);
    syncPrefSwitches(prefs);
    return;
  }

  if (action === 'hide_loan') {
    const prefs = setUserPref('hideLoan', true);
    applyUserPrefs(prefs);
    syncPrefSwitches(prefs);
    return;
  }

  if (action === 'show_loan') {
    const prefs = setUserPref('hideLoan', false);
    applyUserPrefs(prefs);
    syncPrefSwitches(prefs);
    return;
  }

  if (action === 'notifications_on') {
    const prefs = setUserPref('notifications', true);
    syncPrefSwitches(prefs);
    return;
  }

  if (action === 'notifications_off') {
    const prefs = setUserPref('notifications', false);
    syncPrefSwitches(prefs);
    return;
  }

  if (action === 'theme_dark') {
    applyTheme('dark');
    syncThemeToggleUi();
    return;
  }

  if (action === 'theme_light') {
    applyTheme('light');
    syncThemeToggleUi();
    return;
  }

  if (action === 'open_settings') {
    document.getElementById('settings-toggle')?.click();
  }
}
