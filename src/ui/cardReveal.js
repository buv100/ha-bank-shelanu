/**
 * הצגת פרטי כרטיס מלאים —
 * אישור + דיסקליימר, כרטיס מתהפך (CVV בגב), וטיימר של דקה.
 * תומך בכמה כרטיסים — בוחרים לפי data-card-id.
 */

import { mockCards } from '../data/mockCards.js';

/** כמה שניות להציג את הפרטים המלאים לפני סגירה אוטומטית */
const REVEAL_SECONDS = 60;

/** מזהה הטיימר הפעיל — כדי שנוכל לבטל אותו בסגירה ידנית */
let revealTimerId = null;

/** הכרטיס שנבחר להצגה (אחרי לחיצה על "הצגת פרטי כרטיס") */
let selectedCardId = null;

/**
 * מוצא כרטיס לפי מזהה ברשימת הדמו.
 * @param {string | null} cardId
 * @returns {object | undefined}
 */
function findCardById(cardId) {
  return mockCards.find((card) => card.id === cardId);
}

/**
 * בונה את תוכן הכרטיס המתהפך (חזית מלאה + גב עם CVV).
 * @param {object} card
 * @returns {string}
 */
function getFlipCardMarkup(card) {
  const creditClass = card.type === 'credit' ? ' bank-card--credit' : '';

  return `
    <div
      id="card-flip"
      class="card-flip"
      role="button"
      tabindex="0"
      aria-label="הפוך כרטיס להצגת CVV"
      aria-pressed="false"
    >
      <div class="card-flip__inner">
        <div class="card-flip__face card-flip__face--front">
          <article class="bank-card bank-card--bold${creditClass}">
            <div class="bank-card__glow" aria-hidden="true"></div>
            <div class="bank-card__shine" aria-hidden="true"></div>
            <div class="bank-card__stripe" aria-hidden="true"></div>
            <div class="bank-card__top">
              <div>
                <p class="bank-card__brand">${card.brandName}</p>
                <p class="bank-card__product">${card.productName}</p>
              </div>
              <p class="bank-card__network">${card.network}</p>
            </div>
            <div class="bank-card__mid">
              <div class="bank-card__chip" aria-hidden="true"></div>
              <span class="bank-card__contactless" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M8.5 8.5c2.2 2.2 2.2 4.8 0 7"/>
                  <path d="M11.2 6c3.8 3.5 3.8 8.5 0 12"/>
                  <path d="M13.9 3.5c5.2 4.8 5.2 12.2 0 17"/>
                </svg>
              </span>
            </div>
            <p class="bank-card__number">${card.fullNumber}</p>
            <div class="bank-card__bottom">
              <div>
                <p class="bank-card__meta-label">תוקף</p>
                <p class="bank-card__meta-value">${card.expiry}</p>
              </div>
              <div>
                <p class="bank-card__meta-label">בעל הכרטיס</p>
                <p class="bank-card__meta-value">${card.holderName}</p>
              </div>
            </div>
          </article>
        </div>

        <div class="card-flip__face card-flip__face--back">
          <article class="bank-card bank-card--bold bank-card--back${creditClass}">
            <div class="bank-card__magstripe" aria-hidden="true"></div>
            <div class="bank-card__back-panel">
              <div class="bank-card__sig-line" aria-hidden="true"></div>
              <div class="bank-card__cvv-box">
                <p class="bank-card__meta-label">CVV</p>
                <p class="bank-card__cvv-value">${card.cvv}</p>
              </div>
            </div>
            <p class="bank-card__back-note">לחצו שוב כדי לחזור לחזית</p>
          </article>
        </div>
      </div>
    </div>
  `;
}

/**
 * בונה את ה־HTML של חלונות האישור וההצגה (מוסתרים בהתחלה).
 * תוכן הכרטיס נטען דינמית לפי הכרטיס שנבחר.
 * @returns {string}
 */
export function getCardRevealModalsMarkup() {
  return `
    <div id="card-confirm-modal" class="card-modal" hidden>
      <div class="card-modal__backdrop" data-close-confirm></div>
      <div class="card-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="card-confirm-title">
        <h2 id="card-confirm-title" class="card-modal__title">הצגת פרטי כרטיס</h2>
        <p class="card-modal__text">
          אתם עומדים להציג את פרטי הכרטיס המלאים (מספר, תוקף ו־CVV).
        </p>
        <p class="card-modal__disclaimer">
          <strong>דיסקליימר:</strong>
          אל תשתפו את הפרטים עם אף אחד. המסך יוצג לדקה אחת בלבד ולאחר מכן ייסגר אוטומטית.
          זוהי סביבת דמו — אין כאן כרטיס אמיתי.
        </p>
        <div class="card-modal__actions">
          <button id="card-confirm-cancel" class="btn btn-secondary" type="button">ביטול</button>
          <button id="card-confirm-approve" class="btn btn-primary" type="button">אני מאשר/ת להציג</button>
        </div>
      </div>
    </div>

    <div id="card-reveal-modal" class="card-modal" hidden>
      <div class="card-modal__backdrop" data-close-reveal></div>
      <div class="card-modal__dialog card-modal__dialog--reveal" role="dialog" aria-modal="true" aria-labelledby="card-reveal-title">
        <div class="card-reveal__header">
          <h2 id="card-reveal-title" class="card-modal__title">פרטי כרטיס מלאים</h2>
          <p class="card-reveal__timer">
            נסגר בעוד <span id="card-reveal-countdown">01:00</span>
          </p>
        </div>

        <p class="card-reveal__hint">לחצו על הכרטיס כדי להפוך ולראות את ה־CVV</p>

        <div id="card-flip-mount"></div>

        <button id="card-reveal-close" class="btn btn-secondary card-reveal__close" type="button">סגור עכשיו</button>
      </div>
    </div>
  `;
}

/**
 * מציג או מסתיר מודל לפי מזהה.
 * @param {string} id
 * @param {boolean} open
 */
function setModalOpen(id, open) {
  const modal = document.getElementById(id);

  if (!modal) {
    return;
  }

  modal.hidden = !open;
}

/**
 * מעצב שניות לתצוגה MM:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatCountdown(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/**
 * עוצר את הטיימר אם רץ.
 */
function clearRevealTimer() {
  if (revealTimerId !== null) {
    window.clearInterval(revealTimerId);
    revealTimerId = null;
  }
}

/**
 * מחזיר את הכרטיס לחזית (בלי CVV).
 */
function resetCardFlip() {
  const flip = document.getElementById('card-flip');

  if (!flip) {
    return;
  }

  flip.classList.remove('is-flipped');
  flip.setAttribute('aria-pressed', 'false');
}

/**
 * מחבר אירועי היפוך לכרטיס שנטען במודל.
 */
function bindFlipInteractions() {
  const flipBtn = document.getElementById('card-flip');

  flipBtn?.addEventListener('click', () => {
    toggleCardFlip();
  });

  flipBtn?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCardFlip();
    }
  });
}

/**
 * סוגר את מודל הפרטים המלאים ומאפס טיימר והיפוך.
 */
function closeRevealModal() {
  clearRevealTimer();
  resetCardFlip();
  setModalOpen('card-reveal-modal', false);
  selectedCardId = null;
}

/**
 * פותח את מודל הפרטים המלאים ומתחיל ספירה לאחור של דקה.
 */
function openRevealModal() {
  const card = findCardById(selectedCardId);
  const mount = document.getElementById('card-flip-mount');
  const countdownEl = document.getElementById('card-reveal-countdown');

  if (!card || !mount) {
    return;
  }

  mount.innerHTML = getFlipCardMarkup(card);
  bindFlipInteractions();

  setModalOpen('card-confirm-modal', false);
  setModalOpen('card-reveal-modal', true);
  resetCardFlip();
  clearRevealTimer();

  let remaining = REVEAL_SECONDS;

  if (countdownEl) {
    countdownEl.textContent = formatCountdown(remaining);
  }

  revealTimerId = window.setInterval(() => {
    remaining -= 1;

    if (countdownEl) {
      countdownEl.textContent = formatCountdown(remaining);
    }

    if (remaining <= 0) {
      closeRevealModal();
    }
  }, 1000);
}

/**
 * מחליף בין חזית לגב של הכרטיס.
 */
function toggleCardFlip() {
  const flip = document.getElementById('card-flip');

  if (!flip) {
    return;
  }

  const flipped = flip.classList.toggle('is-flipped');
  flip.setAttribute('aria-pressed', String(flipped));
}

/**
 * פותח הצגת פרטי כרטיס מהצ׳אט (אחרי אישור רגיש בשיחה).
 * @param {string | null | undefined} cardId
 * @returns {boolean}
 */
export function openCardRevealForChat(cardId) {
  selectedCardId = cardId || mockCards[0]?.id || null;

  if (!selectedCardId || !document.getElementById('card-reveal-modal')) {
    return false;
  }

  openRevealModal();
  return true;
}

/**
 * אם הגיעו עם ?reveal=card-id — פותחים את מודל הפרטים אחרי טעינה.
 */
export function consumeRevealQueryParam() {
  const params = new URLSearchParams(window.location.search);
  const revealId = params.get('reveal');

  if (!revealId) {
    return;
  }

  window.history.replaceState({}, '', window.location.pathname);
  window.setTimeout(() => {
    openCardRevealForChat(revealId);
  }, 200);
}

/**
 * מחבר את כפתורי ההצגה, האישור, הביטול, ההיפוך והסגירה.
 */
export function bindCardReveal() {
  const confirmModal = document.getElementById('card-confirm-modal');
  const revealModal = document.getElementById('card-reveal-modal');
  const approveBtn = document.getElementById('card-confirm-approve');
  const cancelBtn = document.getElementById('card-confirm-cancel');
  const closeBtn = document.getElementById('card-reveal-close');
  const openButtons = document.querySelectorAll('[data-show-card-details]');

  if (!confirmModal || !revealModal || openButtons.length === 0) {
    return;
  }

  openButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCardId = btn.getAttribute('data-show-card-details');
      setModalOpen('card-confirm-modal', true);
    });
  });

  approveBtn?.addEventListener('click', () => {
    openRevealModal();
  });

  cancelBtn?.addEventListener('click', () => {
    setModalOpen('card-confirm-modal', false);
    selectedCardId = null;
  });

  closeBtn?.addEventListener('click', () => {
    closeRevealModal();
  });

  confirmModal.querySelector('[data-close-confirm]')?.addEventListener('click', () => {
    setModalOpen('card-confirm-modal', false);
    selectedCardId = null;
  });

  revealModal.querySelector('[data-close-reveal]')?.addEventListener('click', () => {
    closeRevealModal();
  });
}
