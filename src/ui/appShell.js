/**
 * מעטפת האפליקציה אחרי התחברות.
 * כותרת עליונה (לוגו מימין + הגדרות משמאל) ותפריט תחתון.
 */

import { getLogoMarkup } from './brand.js';
import { getDemoBannerMarkup } from './demoBanner.js';
import {
  ACCOUNT_PAGE,
  CARDS_PAGE,
  OVERVIEW_PAGE,
  PROFILE_PAGE,
  SAVINGS_PAGE,
  TRANSFERS_PAGE,
} from './navigation.js';
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
  overview: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 19V5"/>
      <path d="M4 19h16"/>
      <path d="M8 15v-4"/>
      <path d="M12 15V8"/>
      <path d="M16 15v-6"/>
    </svg>
  `,
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
  transfers: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M7 16l-4-4 4-4"/>
      <path d="M3 12h14"/>
      <path d="M17 8l4 4-4 4"/>
      <path d="M21 12H7"/>
    </svg>
  `,
  savings: `
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 3v18"/>
      <path d="M8 7h8"/>
      <path d="M6 12h12"/>
      <path d="M9 17h6"/>
    </svg>
  `,
};

/**
 * עוטף תוכן דף במעטפת: דילוג + באנר דמו + כותרת + תוכן + פוטר + תפריט.
 * @param {{
 *   activeNav: 'overview' | 'account' | 'transfers' | 'savings' | 'cards' | 'profile' | null,
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
      href: OVERVIEW_PAGE,
      label: 'ריכוז',
      icon: NAV_ICONS.overview,
      isActive: activeNav === 'overview',
    },
    {
      href: ACCOUNT_PAGE,
      label: 'עו״ש',
      icon: NAV_ICONS.account,
      isActive: activeNav === 'account',
    },
    {
      href: TRANSFERS_PAGE,
      label: 'העברות',
      icon: NAV_ICONS.transfers,
      isActive: activeNav === 'transfers',
    },
    {
      href: SAVINGS_PAGE,
      label: 'חסכונות',
      icon: NAV_ICONS.savings,
      isActive: activeNav === 'savings',
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
