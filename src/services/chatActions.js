/**
 * פעולות שהצ׳אט יכול לבצע בדמו (ניווט וכו׳).
 */

import {
  ACCOUNT_PAGE,
  CARDS_PAGE,
  LOAN_PAGE,
  PROFILE_PAGE,
} from '../ui/navigation.js';

/**
 * מריץ פעולה שהוחזרה מהבוט.
 * @param {string | undefined} action
 */
export function runChatAction(action) {
  if (!action) {
    return;
  }

  const routes = {
    navigate_account: ACCOUNT_PAGE,
    navigate_cards: CARDS_PAGE,
    navigate_profile: PROFILE_PAGE,
    navigate_loan: LOAN_PAGE,
  };

  const href = routes[action];

  if (href) {
    // השהייה קצרה כדי שהמשתמש יספיק לקרוא את ההודעה
    window.setTimeout(() => {
      window.location.assign(href);
    }, 700);
  }
}
