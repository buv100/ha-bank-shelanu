/**
 * דף נחיתה שיווקי — מוצג לפני התחברות (index.html).
 */

import { getBrandMarkup } from '../ui/brand.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { LOGIN_PAGE } from '../ui/navigation.js';
import { getSiteFooterMarkup } from '../ui/siteFooter.js';
import { getSkipLinkMarkup } from '../ui/skipLink.js';

/** @typedef {{ icon: string, title: string, desc: string }} FeatureHighlight */

/** @type {FeatureHighlight[]} */
const FEATURES = [
  {
    icon: `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="3" y="6" width="18" height="13" rx="2"/>
        <path d="M3 10h18"/>
        <path d="M7 15h4"/>
      </svg>
    `,
    title: 'עו״ש חכם',
    desc: 'יתרה ותנועות מתעדכנות אוטומטית — קניות, משכורת חודשית והעברות.',
  },
  {
    icon: `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="2" y="5" width="20" height="14" rx="3"/>
        <path d="M2 10h20"/>
      </svg>
    `,
    title: 'כרטיסים',
    desc: 'חיוב ואשראי לצד מסגרת, חוב ותנועות — לכל כרטיס עיצוב משלו.',
  },
  {
    icon: `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M4 19V9"/>
        <path d="M10 19V5"/>
        <path d="M16 19v-7"/>
        <path d="M20 19V3"/>
      </svg>
    `,
    title: 'השקעות וחסכונות',
    desc: 'תיק מסחר, שוק, מוצרי חיסכון — ותצוגת «כמה נשאר לך באמת».',
  },
  {
    icon: `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5z"/>
      </svg>
    `,
    title: '«הבנקאי» — צ׳אט AI',
    desc: 'עוזר שיחה שעונה לפי הנתונים שלכם בלבד, בלי להמציא מספרים.',
  },
];

/**
 * @param {FeatureHighlight} feature
 * @returns {string}
 */
function getFeatureCardMarkup(feature) {
  return `
    <li class="landing-feature">
      <span class="landing-feature__icon" aria-hidden="true">${feature.icon}</span>
      <h3 class="landing-feature__title">${feature.title}</h3>
      <p class="landing-feature__desc">${feature.desc}</p>
    </li>
  `;
}

/**
 * @returns {string}
 */
export function getLandingMarkup() {
  return `
    ${getSkipLinkMarkup()}
    ${getDemoBannerMarkup()}
    <div class="landing-page">
      <header class="landing-topbar">
        ${getBrandMarkup({ size: 'sm', compact: true })}
        <a class="btn btn-primary landing-topbar__cta" href="${LOGIN_PAGE}">כניסה לחשבון</a>
      </header>

      <main id="main-content" class="landing-hero" tabindex="-1">
        <h1 class="landing-hero__title">בנקאות פשוטה, ברורה ושקטה</h1>
        <p class="landing-hero__subtitle">
          «הבנק שלנו» הוא דמו לימודי — עו״ש, כרטיסים, השקעות, חסכונות והעברות במקום אחד,
          עם עוזר AI שעונה רק לפי הנתונים האמיתיים שלכם.
        </p>
        <div class="landing-hero__actions">
          <a class="btn btn-primary landing-hero__cta" href="${LOGIN_PAGE}">כניסה / הרשמה</a>
        </div>
      </main>

      <section class="landing-features" aria-labelledby="landing-features-heading">
        <h2 id="landing-features-heading" class="landing-features__heading">מה יש בפרויקט</h2>
        <ul class="landing-features__grid">
          ${FEATURES.map(getFeatureCardMarkup).join('')}
        </ul>
      </section>

      ${getSiteFooterMarkup()}
    </div>
  `;
}
