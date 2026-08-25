/**
 * פעילות אוטומטית לדמו — קניות רנדומליות לכל משתמש מחובר.
 * עובד בטיימר בדפדפן + catch-up לפי זמן (אותו רעיון יעבוד גם כ־job מול DB).
 */

import { ensureAccountData } from '../utils/accountStore.js';
import { ensureCardsData, getCardsData } from '../utils/cardStore.js';
import { simulateCardPurchase } from './purchaseSimulator.js';
import { applyDueRecurringExpenses } from './recurringExpenses.js';
import { applyDueSalariesForAllAccounts } from './salaryDeposit.js';

const LAST_RUN_PREFIX = 'ha-bank-auto-activity:';
const TICK_MS = 35000;
const MAX_CATCH_UP = 4;
const CATCH_UP_EVERY_MS = 90_000;

/** @type {number | null} */
let timerId = null;

/** @type {string | null} */
let activeUserId = null;

/** מאגר קניות לדמו — תיאורים כלליים בלבד */
const PURCHASE_POOL = [
  { description: 'סופר', category: 'אוכל', min: 35, max: 220 },
  { description: 'בית קפה', category: 'אוכל', min: 18, max: 75 },
  { description: 'תחבורה', category: 'תחבורה', min: 12, max: 90 },
  { description: 'קניות אונליין', category: 'קניות', min: 40, max: 350 },
  { description: 'בידור', category: 'בידור', min: 25, max: 180 },
  { description: 'פארם', category: 'בריאות', min: 20, max: 140 },
  { description: 'דלק', category: 'תחבורה', min: 80, max: 320 },
  { description: 'מסעדה', category: 'אוכל', min: 60, max: 280 },
];

/**
 * @param {string} userId
 * @returns {string}
 */
function lastRunKey(userId) {
  return `${LAST_RUN_PREFIX}${userId}`;
}

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomBetween(min, max) {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

/**
 * @template T
 * @param {T[]} list
 * @returns {T}
 */
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * @param {string} userId
 * @returns {number}
 */
function getLastRun(userId) {
  const raw = window.localStorage.getItem(lastRunKey(userId));
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

/**
 * @param {string} userId
 * @param {number} timestamp
 */
function setLastRun(userId, timestamp) {
  window.localStorage.setItem(lastRunKey(userId), String(timestamp));
}

/**
 * מריץ קנייה רנדומלית אחת למשתמש.
 * @param {string} userId
 * @returns {boolean}
 */
export function runRandomPurchase(userId) {
  ensureAccountData(userId);
  ensureCardsData(userId);

  const stored = getCardsData(userId);
  const activeCards = (stored?.cards || []).filter((card) => !card.blocked);

  if (activeCards.length === 0) {
    return false;
  }

  const card = pickRandom(activeCards);
  const purchase = pickRandom(PURCHASE_POOL);
  const amount = randomBetween(purchase.min, purchase.max);

  const result = simulateCardPurchase(userId, {
    cardId: card.id,
    amount,
    description: purchase.description,
    category: purchase.category,
  });

  if (result.ok) {
    setLastRun(userId, Date.now());
  }

  return result.ok;
}

/**
 * משלים קניות ש«החמצנו» כשהדף היה סגור — מוגבל כדי לא להציף.
 * @param {string} userId
 * @returns {number} כמה קניות נוצרו
 */
export function catchUpAutoActivity(userId) {
  const last = getLastRun(userId);
  const now = Date.now();

  if (!last) {
    setLastRun(userId, now);
    return 0;
  }

  const elapsed = now - last;
  const due = Math.min(MAX_CATCH_UP, Math.floor(elapsed / CATCH_UP_EVERY_MS));

  let created = 0;

  for (let i = 0; i < due; i += 1) {
    if (runRandomPurchase(userId)) {
      created += 1;
    }
  }

  if (due === 0) {
    // לא מאפסים — נשאיר last כפי שהוא עד קנייה מוצלחת
  } else if (created === 0) {
    setLastRun(userId, now);
  }

  return created;
}

/**
 * מתחיל סימולציה אוטומטית למשתמש המחובר.
 * @param {string} userId
 */
export function startAutoActivity(userId) {
  if (!userId) {
    return;
  }

  if (timerId && activeUserId === userId) {
    applyDueSalariesForAllAccounts({ currentUserId: userId });
    applyDueRecurringExpenses(userId);
    catchUpAutoActivity(userId);
    return;
  }

  stopAutoActivity();
  activeUserId = userId;
  ensureAccountData(userId);
  ensureCardsData(userId);
  applyDueSalariesForAllAccounts({ currentUserId: userId });
  applyDueRecurringExpenses(userId);
  catchUpAutoActivity(userId);

  timerId = window.setInterval(() => {
    if (activeUserId) {
      applyDueSalariesForAllAccounts({ currentUserId: activeUserId });
      applyDueRecurringExpenses(activeUserId);
      runRandomPurchase(activeUserId);
    }
  }, TICK_MS);
}

/**
 * עוצר את הטיימר (למשל ביציאה).
 */
export function stopAutoActivity() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }

  activeUserId = null;
}
