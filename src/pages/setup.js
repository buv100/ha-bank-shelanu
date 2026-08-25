/**
 * דף פתיחת חשבון — הזנת נתונים ראשוניים.
 */

import { MARKET_INSTRUMENTS } from '../data/mockMarket.js';
import { getBrandMarkup } from '../ui/brand.js';
import { getDemoBannerMarkup } from '../ui/demoBanner.js';
import { OVERVIEW_PAGE } from '../ui/navigation.js';
import { getSiteFooterMarkup } from '../ui/siteFooter.js';
import { getSkipLinkMarkup } from '../ui/skipLink.js';
import { CARD_PRODUCTS, EXPENSE_CATEGORIES } from '../services/bootstrapAccount.js';
import { submitOnboarding } from '../services/onboardingApi.js';
import { startAutoActivity } from '../services/autoActivity.js';
import { getCurrentProfile, getCurrentUserId } from '../utils/session.js';

/**
 * @returns {string}
 */
function cardRowMarkup() {
  const options = CARD_PRODUCTS.map(
    (item) => `<option value="${item.id}">${item.productName}</option>`,
  ).join('');

  return `
    <div class="setup-row" data-card-row>
      <label class="field">
        <span class="field-label">סוג כרטיס</span>
        <select class="field-input" name="cardProduct">${options}</select>
      </label>
      <label class="field">
        <span class="field-label">מסגרת (₪, לאשראי)</span>
        <input class="field-input" name="cardLimit" type="number" min="0" step="500" placeholder="ריק = אוטומטי" />
      </label>
      <button type="button" class="setup-remove" data-remove-row>הסרה</button>
    </div>
  `;
}

/**
 * @returns {string}
 */
function expenseRowMarkup() {
  const options = EXPENSE_CATEGORIES.map(
    (item) => `<option value="${item}">${item}</option>`,
  ).join('');

  return `
    <div class="setup-row" data-expense-row>
      <label class="field">
        <span class="field-label">תיאור</span>
        <input class="field-input" name="expenseName" maxlength="40" placeholder="חשמל, שכירות…" />
      </label>
      <label class="field">
        <span class="field-label">סכום חודשי</span>
        <input class="field-input" name="expenseAmount" type="number" min="0" step="10" />
      </label>
      <label class="field">
        <span class="field-label">קטגוריה</span>
        <select class="field-input" name="expenseCategory">${options}</select>
      </label>
      <button type="button" class="setup-remove" data-remove-row>הסרה</button>
    </div>
  `;
}

/**
 * @returns {string}
 */
function investRowMarkup() {
  const options = MARKET_INSTRUMENTS.map(
    (item) => `<option value="${item.symbol}">${item.name}</option>`,
  ).join('');

  return `
    <div class="setup-row" data-invest-row>
      <label class="field">
        <span class="field-label">מכשיר</span>
        <select class="field-input" name="investSymbol">${options}</select>
      </label>
      <label class="field">
        <span class="field-label">שווי (₪)</span>
        <input class="field-input" name="investValue" type="number" min="0" step="100" />
      </label>
      <button type="button" class="setup-remove" data-remove-row>הסרה</button>
    </div>
  `;
}

/**
 * @returns {string}
 */
export function getSetupMarkup() {
  const profile = getCurrentProfile();
  const name = profile?.fullName || '';

  return `
    ${getSkipLinkMarkup()}
    ${getDemoBannerMarkup()}
    <section class="screen screen-login is-active" aria-label="פתיחת חשבון">
      <div id="main-content" class="setup-card" tabindex="-1">
        ${getBrandMarkup({ size: 'md', showTagline: false })}
        <h1 class="login-title">פתיחת חשבון</h1>
        <p class="login-subtitle">
          שלום ${name}. מלאו מה שיש — סניף, יתרה זמינה ומספרי כרטיס יווצרו אוטומטית.
        </p>

        <p id="setup-error" class="consent-error" hidden></p>

        <form id="setup-form" class="setup-form">
          <fieldset class="setup-block">
            <legend>פרטי קשר</legend>
            <label class="field">
              <span class="field-label">טלפון</span>
              <input class="field-input" name="phone" type="tel" maxlength="20" placeholder="050-1234567" />
            </label>
            <label class="field">
              <span class="field-label">תעודת זהות</span>
              <input class="field-input" name="idNumber" inputmode="numeric" maxlength="9" placeholder="9 ספרות" />
            </label>
            <label class="field">
              <span class="field-label">כתובת</span>
              <input class="field-input" name="address" maxlength="120" placeholder="רחוב, עיר" />
            </label>
          </fieldset>

          <fieldset class="setup-block">
            <legend>משכורת</legend>
            <label class="field">
              <span class="field-label">משכורת חודשית (₪)</span>
              <input class="field-input" name="monthlySalary" type="number" min="0" step="100" placeholder="ריק = יווצר אוטומטית" />
            </label>
          </fieldset>

          <fieldset class="setup-block">
            <legend>כרטיסים</legend>
            <p class="setup-hint">ריק = יווצרו כרטיס חיוב וכרטיס אשראי.</p>
            <div id="setup-cards"></div>
            <button type="button" class="btn btn-secondary" data-add="cards">הוספת כרטיס</button>
          </fieldset>

          <fieldset class="setup-block">
            <legend>הוצאות קבועות</legend>
            <p class="setup-hint">ריק = יווצרו כמה הוצאות טיפוסיות.</p>
            <div id="setup-expenses"></div>
            <button type="button" class="btn btn-secondary" data-add="expenses">הוספת הוצאה</button>
          </fieldset>

          <fieldset class="setup-block">
            <legend>השקעות</legend>
            <p class="setup-hint">ריק = תווסף החזקה קטנה במדד ת״א 125.</p>
            <div id="setup-invests"></div>
            <button type="button" class="btn btn-secondary" data-add="invests">הוספת השקעה</button>
          </fieldset>

          <button class="btn btn-primary" type="submit">פתחו את החשבון</button>
        </form>
      </div>
      ${getSiteFooterMarkup()}
    </section>
  `;
}

/**
 * מחבר טופס פתיחה.
 */
export function bindSetupEvents() {
  const form = document.getElementById('setup-form');
  const errorEl = document.getElementById('setup-error');

  form?.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.matches('[data-remove-row]')) {
      const row = target.closest('.setup-row');
      const list = row?.parentElement;

      if (row && list && list.querySelectorAll('.setup-row').length > 1) {
        row.remove();
      } else if (row) {
        row.querySelectorAll('input').forEach((input) => {
          input.value = '';
        });
      }

      return;
    }

    const add = target.getAttribute('data-add');

    if (add === 'cards') {
      document.getElementById('setup-cards')?.insertAdjacentHTML('beforeend', cardRowMarkup());
    }

    if (add === 'expenses') {
      document.getElementById('setup-expenses')?.insertAdjacentHTML('beforeend', expenseRowMarkup());
    }

    if (add === 'invests') {
      document.getElementById('setup-invests')?.insertAdjacentHTML('beforeend', investRowMarkup());
    }
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
    }

    const cards = [...form.querySelectorAll('[data-card-row]')].map((row) => ({
      productId: row.querySelector('[name="cardProduct"]')?.value || '',
      creditLimit: Number(row.querySelector('[name="cardLimit"]')?.value) || 0,
    })).filter((row) => row.productId);

    const expenses = [...form.querySelectorAll('[data-expense-row]')].map((row) => ({
      description: String(row.querySelector('[name="expenseName"]')?.value || '').trim(),
      amount: Number(row.querySelector('[name="expenseAmount"]')?.value) || 0,
      category: String(row.querySelector('[name="expenseCategory"]')?.value || 'חשבונות'),
    })).filter((row) => row.description && row.amount > 0);

    const investments = [...form.querySelectorAll('[data-invest-row]')].map((row) => ({
      symbol: String(row.querySelector('[name="investSymbol"]')?.value || ''),
      value: Number(row.querySelector('[name="investValue"]')?.value) || 0,
    })).filter((row) => row.symbol && row.value > 0);

    const formData = new FormData(form);
    const result = await submitOnboarding({
      phone: String(formData.get('phone') || ''),
      idNumber: String(formData.get('idNumber') || ''),
      address: String(formData.get('address') || ''),
      monthlySalary: Number(formData.get('monthlySalary')) || 0,
      cards,
      expenses,
      investments,
    });

    if (!result.ok) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = result.error || 'השמירה נכשלה';
      }

      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
      }

      return;
    }

    const userId = getCurrentUserId();

    if (userId) {
      startAutoActivity(userId);
    }

    window.location.assign(OVERVIEW_PAGE);
  });
}
