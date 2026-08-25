/**
 * דף פירוט השקעה בודדת.
 */

import {
  buyInvestment,
  sellInvestment,
} from '../utils/investmentStore.js';
import { resolveInvestmentDetail } from '../utils/investmentDetail.js';
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
} from '../utils/format.js';
import {
  getCurrentAccount,
  getCurrentUserId,
} from '../utils/session.js';
import {
  getInvestmentDetailHref,
  INVESTMENTS_PAGE,
  INVESTMENTS_SEARCH_PAGE,
} from '../ui/navigation.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { getInvestChatToggleMarkup } from '../ui/investChatWidget.js';
import { getThemeToggleMarkup } from '../ui/themeToggle.js';
import {
  bindAmountModalActions,
  closeAmountModal,
  getAmountModalMarkup,
  openAmountModal,
  setAmountConfirmHandler,
  showMxToast,
} from '../utils/mxTradeUi.js';

/**
 * @returns {{ holdingId: string | null, marketId: string | null }}
 */
export function readDetailQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    holdingId: params.get('holding'),
    marketId: params.get('market'),
  };
}

/**
 * @param {number} percent
 * @returns {string}
 */
function getChangeClass(percent) {
  if (percent > 0) return 'mx-chg--up';
  if (percent < 0) return 'mx-chg--down';
  return 'mx-chg--flat';
}

/**
 * @param {number[]} week
 * @returns {string}
 */
function getWeekChartMarkup(week) {
  const values = week.length ? week : [0];
  const maxAbs = Math.max(...values.map((v) => Math.abs(v)), 0.2);

  return `
    <div class="mx-detail-chart" role="img" aria-label="שינוי יומי בשבוע האחרון בדמו">
      ${values
        .map((value, index) => {
          const height = Math.max(8, Math.round((Math.abs(value) / maxAbs) * 100));
          const tone =
            value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
          return `
            <div class="mx-detail-chart__col">
              <div
                class="mx-detail-chart__bar mx-detail-chart__bar--${tone}"
                style="height:${height}%"
                title="${formatSignedPercent(value)}"
              ></div>
              <span class="mx-detail-chart__label">י${index + 1}</span>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

/**
 * @param {import('../utils/investmentDetail.js').InvestmentDetailView} detail
 * @returns {string}
 */
function getDetailContentMarkup(detail) {
  const cash = getCurrentAccount()?.balance || 0;
  const dailyClass = getChangeClass(detail.dailyChangePercent);
  const purchaseClass = getChangeClass(detail.purchaseProfitPercent);
  const ytdClass = getChangeClass(detail.ytdPercent);
  const year1Class = getChangeClass(detail.year1Percent);
  const tags = detail.tags
    .map((tag) => `<span class="mx-detail-tag">${tag}</span>`)
    .join('');

  const ownedBlock = detail.owned
    ? `
      <section class="mx-card" aria-labelledby="mx-owned-title">
        <h2 id="mx-owned-title" class="mx-card__title">בתיק שלי</h2>
        <dl class="mx-detail-grid">
          <div>
            <dt>שווי החזקה</dt>
            <dd>${formatCurrency(detail.value)}</dd>
          </div>
          <div>
            <dt>עלות קנייה</dt>
            <dd>${formatCurrency(detail.costBasis)}</dd>
          </div>
          <div>
            <dt>רווח מקנייה</dt>
            <dd class="mx-chg ${purchaseClass}">
              ${formatSignedCurrency(detail.purchaseProfit)}
              (${formatSignedPercent(detail.purchaseProfitPercent)})
            </dd>
          </div>
          <div>
            <dt>משקל בתיק</dt>
            <dd>${detail.weightPercent}%</dd>
          </div>
          ${
            detail.unitsEstimate != null
              ? `<div>
                  <dt>יחידות (הערכה)</dt>
                  <dd>${detail.unitsEstimate}</dd>
                </div>`
              : ''
          }
        </dl>
      </section>
    `
    : `
      <section class="mx-card">
        <p class="mx-empty" style="padding:0;border:0">המכשיר עדיין לא בתיק. אפשר לקנות מדף זה.</p>
      </section>
    `;

  const actions = `
    <div class="mx-detail-actions">
      ${
        detail.marketId || detail.holdingId
          ? `<button
              type="button"
              class="mx-btn mx-btn--buy"
              data-action="open-buy"
              data-holding-id="${detail.holdingId || ''}"
              data-market-id="${detail.marketId || ''}"
              data-title="${detail.name}"
              data-max="${cash}"
            >קנה</button>`
          : ''
      }
      ${
        detail.owned && detail.holdingId
          ? `<button
              type="button"
              class="mx-btn mx-btn--sell"
              data-action="open-sell"
              data-holding-id="${detail.holdingId}"
              data-title="${detail.name}"
              data-max="${detail.value}"
            >מכור</button>`
          : ''
      }
      <a class="mx-btn mx-btn--secondary" href="${INVESTMENTS_SEARCH_PAGE}">חיפוש לקנייה</a>
    </div>
  `;

  return `
    <div id="mx-detail-root" class="mx-app mx-detail">
      <section class="mx-summary mx-detail-hero" aria-label="סיכום מכשיר">
        <div class="mx-summary__block">
          <p class="mx-label">${detail.symbol} · ${detail.type}</p>
          <p class="mx-big mx-big--sm">${detail.name}</p>
          <p class="mx-chg ${dailyClass}">
            ${formatSignedPercent(detail.dailyChangePercent)} היום
            ${
              detail.unitPrice != null
                ? `· מחיר ייחוס ${formatCurrency(detail.unitPrice)}`
                : ''
            }
          </p>
          <div class="mx-detail-tags">${tags}</div>
        </div>
      </section>

      <section class="mx-card" aria-labelledby="mx-about-title">
        <h2 id="mx-about-title" class="mx-card__title">על המכשיר</h2>
        <p class="mx-detail-desc">${detail.description}</p>
        <dl class="mx-detail-grid">
          <div>
            <dt>רמת סיכון</dt>
            <dd>${detail.risk}</dd>
          </div>
          <div>
            <dt>מטבע</dt>
            <dd>${detail.currency}</dd>
          </div>
          <div>
            <dt>בורסה / זירה</dt>
            <dd>${detail.exchange}</dd>
          </div>
          <div>
            <dt>דמי ניהול (דמו)</dt>
            <dd>${detail.expenseRatioPercent}%</dd>
          </div>
          <div>
            <dt>מתחילת השנה</dt>
            <dd class="mx-chg ${ytdClass}">${formatSignedPercent(detail.ytdPercent)}</dd>
          </div>
          <div>
            <dt>12 חודשים</dt>
            <dd class="mx-chg ${year1Class}">${formatSignedPercent(detail.year1Percent)}</dd>
          </div>
        </dl>
      </section>

      <section class="mx-card" aria-labelledby="mx-week-title">
        <h2 id="mx-week-title" class="mx-card__title">שינוי יומי · 7 ימים</h2>
        ${getWeekChartMarkup(detail.weekChangePercent)}
        <p class="mx-note">גרף דמו בלבד — לא נתוני שוק חיים.</p>
      </section>

      ${ownedBlock}
      ${actions}
      <p class="mx-note">דמו ללמידה — לא ייעוץ השקעות ולא מסחר אמיתי.</p>
    </div>
  `;
}

/**
 * @returns {string}
 */
export function getInvestmentsDetailMarkup() {
  const query = readDetailQuery();
  const detail = resolveInvestmentDetail(query);

  if (!detail) {
    return `
      <div class="mx-shell">
        ${getDemoBannerMarkup()}
        <header class="mx-top">
          <div>
            <p class="mx-top__title">פירוט השקעה</p>
            <p class="mx-top__sub">לא נמצא</p>
          </div>
          <div class="mx-top__actions">
            ${getInvestChatToggleMarkup()}
            ${getThemeToggleMarkup()}
            <a class="mx-back" href="${INVESTMENTS_PAGE}">חזרה לתיק</a>
          </div>
        </header>
        <main id="main-content" class="mx-main">
          <div class="mx-app">
            <p class="mx-empty">לא נמצאה השקעה. חזרו לתיק או לחיפוש.</p>
            <a class="mx-btn mx-btn--search" href="${INVESTMENTS_PAGE}">לתיק</a>
          </div>
        </main>
      </div>
    `;
  }

  return `
    <div class="mx-shell">
      ${getDemoBannerMarkup()}
      <header class="mx-top">
        <div>
          <p class="mx-top__title">${detail.name}</p>
          <p class="mx-top__sub">${detail.symbol} · פירוט</p>
        </div>
        <div class="mx-top__actions">
          ${getInvestChatToggleMarkup()}
          ${getThemeToggleMarkup()}
          <a class="mx-back" href="${INVESTMENTS_PAGE}">חזרה לתיק</a>
        </div>
      </header>
      <main id="main-content" class="mx-main">
        ${getDetailContentMarkup(detail)}
      </main>
      ${getAmountModalMarkup()}
      <div class="mx-toast" id="mx-toast" hidden role="status" aria-live="polite"></div>
    </div>
  `;
}

/**
 * מרענן את תוכן הפירוט אחרי קנייה/מכירה.
 */
export function refreshInvestmentsDetailView() {
  const root = document.getElementById('mx-detail-root');
  const query = readDetailQuery();
  let detail = resolveInvestmentDetail(query);

  if (!detail && query.marketId) {
    detail = resolveInvestmentDetail({ marketId: query.marketId });
  }

  if (!root?.parentElement || !detail) {
    return;
  }

  // עדכון כתובת אם נוצר holding חדש
  if (detail.holdingId && !query.holdingId) {
    const nextHref = getInvestmentDetailHref({
      holdingId: detail.holdingId,
      marketId: detail.marketId || undefined,
    });
    window.history.replaceState({}, '', nextHref);
  }

  const temp = document.createElement('div');
  temp.innerHTML = getDetailContentMarkup(detail);
  const next = temp.querySelector('#mx-detail-root');

  if (next) {
    root.replaceWith(next);
  }

  const title = document.querySelector('.mx-top__title');
  const sub = document.querySelector('.mx-top__sub');

  if (title) title.textContent = detail.name;
  if (sub) sub.textContent = `${detail.symbol} · פירוט`;
}

/**
 * מאזינים לקנייה/מכירה בדף הפירוט.
 */
export function bindInvestmentsDetailActions() {
  setAmountConfirmHandler((trade, amount) => {
    const userId = getCurrentUserId();

    if (!userId) {
      return;
    }

    const result =
      trade.mode === 'buy'
        ? buyInvestment(userId, {
            amount,
            holdingId: trade.holdingId,
            marketId: trade.marketId,
          })
        : sellInvestment(userId, {
            amount,
            holdingId: trade.holdingId || '',
          });

    if (!result.ok) {
      showMxToast(result.error || 'הפעולה נכשלה', 'err');
      return;
    }

    closeAmountModal();
    refreshInvestmentsDetailView();
    showMxToast(trade.mode === 'buy' ? 'הקנייה בוצעה' : 'המכירה בוצעה');
  });

  bindAmountModalActions();

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const btn = target.closest('[data-action]');

    if (!(btn instanceof HTMLElement)) {
      return;
    }

    const action = btn.dataset.action;

    if (action === 'open-buy') {
      const maxAmount = Number(btn.dataset.max) || 0;

      if (maxAmount < 50) {
        showMxToast('אין מספיק יתרה בעו״ש', 'err');
        return;
      }

      openAmountModal({
        mode: 'buy',
        holdingId: btn.dataset.holdingId || undefined,
        marketId: btn.dataset.marketId || undefined,
        title: btn.dataset.title || 'קנייה',
        maxAmount,
      });
      return;
    }

    if (action === 'open-sell') {
      const holdingId = btn.dataset.holdingId;
      const maxAmount = Number(btn.dataset.max) || 0;

      if (!holdingId || maxAmount < 50) {
        showMxToast('אין סכום מספיק למכירה', 'err');
        return;
      }

      openAmountModal({
        mode: 'sell',
        holdingId,
        title: btn.dataset.title || 'מכירה',
        maxAmount,
      });
    }
  });
}
