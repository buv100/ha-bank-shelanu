/**
 * ניהול מצב בהיר / כהה.
 * נשמר ב־sessionStorage כדי שיישאר בין דפים באותו טאב (בלי DB).
 */

const THEME_KEY = 'ha-bank-theme';

/**
 * מחזיר את ערכת הנושא הנוכחית.
 * @returns {'light' | 'dark'}
 */
export function getTheme() {
  const saved = sessionStorage.getItem(THEME_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

/**
 * מחיל ערכת נושא על המסמך ושומר אותה לטאב הנוכחי.
 * @param {'light' | 'dark'} theme
 */
export function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  sessionStorage.setItem(THEME_KEY, next);
}

/**
 * טוען את ערכת הנושא השמורה (או בהיר כברירת מחדל).
 */
export function initTheme() {
  applyTheme(getTheme());
}

/**
 * מחליף בין בהיר לכהה ומחזיר את המצב החדש.
 * @returns {'light' | 'dark'}
 */
export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
