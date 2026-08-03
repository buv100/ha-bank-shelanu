/**
 * מעטפת האפליקציה אחרי התחברות.
 * כותרת עליונה (לוגו מימין + הגדרות משמאל) ותפריט תחתון.
 */

import { getLogoMarkup } from './brand.js';
import { getDemoBannerMarkup } from './demoBanner.js';
import { ACCOUNT_PAGE, CARDS_PAGE, PROFILE_PAGE } from './navigation.js';
import { getSettingsMenuMarkup } from './settingsMenu.js';
import { getSiteFooterMarkup } from './siteFooter.js';
import { getSkipLinkMarkup } from './skipLink.js';
import { getThemeToggleMarkup } from './themeToggle.js';

/**
 * בונה פריט אחד בתפריט התחתון.
 * @param {{ href: string, label: string, icon: string, isActive: boolean }} item
 * @returns {string}
 */
function getNavItemMarkup(item) {
  const activeClass = item.isActive ? ' app-nav__item--active' : '';
  const ariaCurrent = item.isActive ? ' aria-current="page"' : '';

  return `
    <a class="app-nav__item${activeClass}" href="${item.href}"${ariaCurrent}>
      <span class="app-nav__icon" aria-hidden="true">${item.icon}</span>
      <span class="app-nav__label">${item.label}</span>
    </a>
  `;
}

/**
 * אייקונים פשוטים ב־SVG (בלי תמונות חיצוניות) לתפריט.
 */
const NAV_ICONS = {
  account: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M3 10h18"/>
    </svg>
  `,
  cards: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M2 10h20"/>
      <path d="M6 15h4"/>
    </svg>
  `,
  profile: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="8" r="3.5"/>
      <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"/>
    </svg>
  `,
};

/**
 * עוטף תוכן דף במעטפת: דילוג + באנר דמו + כותרת + תוכן + פוטר + תפריט.
 * @param {{
 *   activeNav: 'account' | 'cards' | 'profile' | null,
 *   title: string,
 *   content: string
 * }} options
 * @returns {string}
 */
export function wrapInAppShell(options) {
  const activeNav = options.activeNav;
  const title = options.title;
  const content = options.content;

  const navItems = [
    {
      href: ACCOUNT_PAGE,
      label: 'עו״ש',
      icon: NAV_ICONS.account,
      isActive: activeNav === 'account',
    },
    {
      href: CARDS_PAGE,
      label: 'כרטיסים',
      icon: NAV_ICONS.cards,
      isActive: activeNav === 'cards',
    },
    {
      href: PROFILE_PAGE,
      label: 'פרופיל',
      icon: NAV_ICONS.profile,
      isActive: activeNav === 'profile',
    },
  ];

  return `
    ${getSkipLinkMarkup()}
    <div class="app-shell">
      ${getDemoBannerMarkup()}

      <header class="app-topbar">
        <div class="app-topbar__brand">
          ${getLogoMarkup('sm')}
          <div class="app-topbar__text">
            <p class="app-topbar__bank">הבנק שלנו</p>
            <h1 class="app-topbar__title">${title}</h1>
          </div>
        </div>

        <div class="app-topbar__actions">
          ${getThemeToggleMarkup()}
          ${getSettingsMenuMarkup()}
        </div>
      </header>

      <main id="main-content" class="app-main" tabindex="-1">
        ${content}
      </main>

      ${getSiteFooterMarkup()}

      <nav class="app-nav" aria-label="ניווט ראשי">
        ${navItems.map(getNavItemMarkup).join('')}
      </nav>
    </div>
  `;
}
