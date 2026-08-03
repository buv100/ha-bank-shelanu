/**
 * העדפות משתמש לדמו —
 * נשמרות ב־sessionStorage ומסונכרנות בין תפריט ההגדרות לדף הפרופיל.
 */

const STORAGE_KEY = 'ha-bank-prefs';

/** ערכי ברירת מחדל להעדפות */
const DEFAULT_PREFS = {
  hideBalance: false,
  hideLoan: false,
  notifications: true,
};

/**
 * טוען העדפות מהזיכרון המקומי של הסשן.
 * @returns {{ hideBalance: boolean, hideLoan: boolean, notifications: boolean }}
 */
export function loadUserPrefs() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...DEFAULT_PREFS };
    }

    const parsed = JSON.parse(raw);
    return {
      hideBalance: Boolean(parsed.hideBalance),
      hideLoan: Boolean(parsed.hideLoan),
      notifications: parsed.notifications !== false,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/**
 * שומר העדפות לסשן הנוכחי.
 * @param {{ hideBalance: boolean, hideLoan: boolean, notifications: boolean }} prefs
 */
export function saveUserPrefs(prefs) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * מעדכן העדפה אחת ושומר.
 * @param {'hideBalance' | 'hideLoan' | 'notifications'} key
 * @param {boolean} value
 * @returns {{ hideBalance: boolean, hideLoan: boolean, notifications: boolean }}
 */
export function setUserPref(key, value) {
  const next = { ...loadUserPrefs(), [key]: value };
  saveUserPrefs(next);
  return next;
}

/**
 * מסתיר/מציג את סכום היתרה בדף העו״ש (אם קיים בדף).
 * @param {boolean} hide
 */
export function applyHideBalance(hide) {
  const balance = document.getElementById('account-balance');

  if (!balance) {
    return;
  }

  if (hide) {
    if (!balance.dataset.realBalance) {
      balance.dataset.realBalance = balance.textContent || '';
    }
    balance.textContent = '••••••';
    balance.classList.add('balance-value--hidden');
  } else if (balance.dataset.realBalance) {
    balance.textContent = balance.dataset.realBalance;
    balance.classList.remove('balance-value--hidden');
  }
}

/**
 * מסתיר/מציג את כרטיס פרסומת ההלוואה (אם קיים בדף).
 * @param {boolean} hide
 */
export function applyHideLoan(hide) {
  const loan = document.querySelector('.loan-float');

  if (!loan) {
    return;
  }

  loan.classList.toggle('loan-float--hidden', hide);
  loan.setAttribute('aria-hidden', String(hide));
}

/**
 * מחיל את כל ההעדפות הרלוונטיות על הדף הנוכחי.
 * @param {{ hideBalance: boolean, hideLoan: boolean, notifications: boolean }} [prefs]
 */
export function applyUserPrefs(prefs = loadUserPrefs()) {
  applyHideBalance(prefs.hideBalance);
  applyHideLoan(prefs.hideLoan);
}
