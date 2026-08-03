/**
 * מעטפת לדפי הצהרות משפטיות —
 * בלי תפריט תחתון, עם חזרה ופוטר.
 */

import { getLogoMarkup } from './brand.js';
import { getDemoBannerMarkup } from './demoBanner.js';
import { LOGIN_PAGE } from './navigation.js';
import { getSiteFooterMarkup } from './siteFooter.js';
import { getSkipLinkMarkup } from './skipLink.js';

/**
 * עוטף תוכן של דף משפטי.
 * @param {{ title: string, content: string, backHref?: string, backLabel?: string }} options
 * @returns {string}
 */
export function wrapInLegalShell(options) {
  const title = options.title;
  const content = options.content;
  const backHref = options.backHref || LOGIN_PAGE;
  const backLabel = options.backLabel || 'חזרה להתחברות';

  return `
    ${getSkipLinkMarkup()}
    <div class="legal-shell">
      ${getDemoBannerMarkup()}

      <header class="legal-topbar">
        <div class="legal-topbar__brand">
          ${getLogoMarkup('sm')}
          <div>
            <p class="legal-topbar__bank">הבנק שלנו</p>
            <h1 class="legal-topbar__title">${title}</h1>
          </div>
        </div>
        <a class="legal-back" href="${backHref}">${backLabel}</a>
      </header>

      <main id="main-content" class="legal-main" tabindex="-1">
        ${content}
      </main>

      ${getSiteFooterMarkup()}
    </div>
  `;
}
