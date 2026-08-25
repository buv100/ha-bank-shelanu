/**
 * אחסון כרטיסים לפי משתמש — חוב/מסגרת/תנועות כרטיס ב־localStorage.
 * הממשקים (ensure / get / chargeCredit / list) מוכנים להחלפה ב־API/DB.
 */

import { findUserById } from '../data/mockUsers.js';

const STORAGE_PREFIX = 'ha-bank-cards:';

/**
 * @typedef {{ id: string, date: string, description: string, amount: number, category: string }} CardTransaction
 * @typedef {{
 *   id: string,
 *   type: string,
 *   creditLimit: number,
 *   debt: number,
 *   blocked: boolean,
 *   transactions: CardTransaction[]
 * }} CardRuntime
 * @typedef {{ cards: CardRuntime[] }} CardsData
 */

/**
 * @param {string} userId
 * @returns {string}
 */
function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * מסגרת אשראי ברירת מחדל לפי סוג הכרטיס (כשאין בשדה).
 * @param {object} card
 * @returns {number}
 */
export function getDefaultCreditLimit(card) {
  if (typeof card.creditLimit === 'number') {
    return card.creditLimit;
  }

  if (card.variant === 'platinum' || /פלטינום|platinum/i.test(card.productName || '')) {
    return 50000;
  }

  if (/זהב|gold/i.test(card.productName || '')) {
    return 30000;
  }

  if (card.type === 'credit') {
    return 15000;
  }

  return 0;
}

/**
 * @param {string} userId
 * @returns {CardsData | null}
 */
function createSeedFromMock(userId) {
  const user = findUserById(userId);

  if (!user) {
    return null;
  }

  return {
    cards: user.cards.map((card) => ({
      id: card.id,
      type: card.type,
      creditLimit: getDefaultCreditLimit(card),
      debt: 0,
      blocked: false,
      lastFour: card.lastFour || '',
      transactions: [],
    })),
  };
}

/**
 * @param {object} card
 * @returns {CardRuntime}
 */
function normalizeRuntimeCard(card) {
  return {
    id: card.id,
    type: card.type,
    creditLimit: Number(card.creditLimit) || 0,
    debt: Number(card.debt) || 0,
    blocked: Boolean(card.blocked),
    lastFour: card.lastFour ? String(card.lastFour) : '',
    transactions: Array.isArray(card.transactions) ? card.transactions : [],
  };
}

/**
 * @param {string} userId
 * @returns {CardsData | null}
 */
export function getCardsData(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.cards)) {
      return null;
    }

    return {
      cards: parsed.cards.map((card) => normalizeRuntimeCard(card)),
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} userId
 * @param {CardsData} data
 */
export function saveCardsData(userId, data) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(data));
}

/**
 * מוודא שיש נתוני כרטיסים — ואם נוספו כרטיסים בזרע, משלים אותם.
 * @param {string} userId
 * @returns {CardsData | null}
 */
export function ensureCardsData(userId) {
  const existing = getCardsData(userId);
  const seed = createSeedFromMock(userId);

  if (!seed) {
    return existing;
  }

  if (!existing) {
    saveCardsData(userId, seed);
    return seed;
  }

  const byId = new Map(existing.cards.map((card) => [card.id, card]));
  let changed = false;

  seed.cards.forEach((seedCard) => {
    if (!byId.has(seedCard.id)) {
      byId.set(seedCard.id, seedCard);
      changed = true;
    }
  });

  if (changed) {
    const merged = { cards: [...byId.values()] };
    saveCardsData(userId, merged);
    return merged;
  }

  return existing;
}

/**
 * @returns {string}
 */
function createTransactionId() {
  return `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * מוצא כרטיס runtime לפי מזהה.
 * @param {CardsData} data
 * @param {string} cardId
 * @returns {CardRuntime | undefined}
 */
function findRuntimeCard(data, cardId) {
  return data.cards.find((card) => card.id === cardId);
}

/**
 * חיוב אשראי — מעלה חוב ומוסיף תנועת כרטיס (לא נוגע בעו״ש).
 * @param {string} userId
 * @param {string} cardId
 * @param {{ date: string, description: string, amount: number, category: string }} input
 * @returns {{ ok: boolean, reason?: string, card?: CardRuntime }}
 */
export function chargeCreditCard(userId, cardId, input) {
  const data = ensureCardsData(userId);

  if (!data) {
    return { ok: false, reason: 'no-data' };
  }

  const card = findRuntimeCard(data, cardId);

  if (!card || card.type !== 'credit') {
    return { ok: false, reason: 'not-credit' };
  }

  if (card.blocked) {
    return { ok: false, reason: 'blocked' };
  }

  const amount = Math.abs(Number(input.amount));

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'bad-amount' };
  }

  const available = card.creditLimit - card.debt;

  if (amount > available) {
    return { ok: false, reason: 'over-limit' };
  }

  const transaction = {
    id: createTransactionId(),
    date: input.date,
    description: String(input.description || '').trim() || 'קנייה באשראי',
    amount,
    category: String(input.category || '').trim() || 'קניות',
  };

  card.debt = Number((card.debt + amount).toFixed(2));
  card.transactions = [transaction, ...card.transactions];
  saveCardsData(userId, data);

  return { ok: true, card };
}

/**
 * רשימת תנועות כרטיס (מוכן ל־API).
 * @param {string} userId
 * @param {string} cardId
 * @returns {CardTransaction[]}
 */
export function listCardTransactions(userId, cardId) {
  const data = ensureCardsData(userId);
  return findRuntimeCard(data || { cards: [] }, cardId)?.transactions || [];
}

/**
 * מחזיר runtime של כרטיס בודד.
 * @param {string} userId
 * @param {string} cardId
 * @returns {CardRuntime | null}
 */
export function getCardRuntime(userId, cardId) {
  const data = ensureCardsData(userId);
  return findRuntimeCard(data || { cards: [] }, cardId) || null;
}

/**
 * האם הכרטיס חסום.
 * @param {string} userId
 * @param {string} cardId
 * @returns {boolean}
 */
export function isCardBlocked(userId, cardId) {
  return Boolean(getCardRuntime(userId, cardId)?.blocked);
}

/**
 * חוסם או מבטל חסימה לכרטיס — הכרטיס נשאר ברשימה.
 * @param {string} userId
 * @param {string} cardId
 * @param {boolean} blocked
 * @returns {{ ok: boolean, card?: CardRuntime, reason?: string }}
 */
export function setCardBlocked(userId, cardId, blocked) {
  const data = ensureCardsData(userId);

  if (!data) {
    return { ok: false, reason: 'no-data' };
  }

  const card = findRuntimeCard(data, cardId);

  if (!card) {
    return { ok: false, reason: 'no-card' };
  }

  card.blocked = Boolean(blocked);
  saveCardsData(userId, data);
  return { ok: true, card };
}
