/**
 * אחסון תיק השקעות + רשימת מעקב —
 * כולל עלות קנייה (costBasis) לחישוב רווח מקנייה.
 */

import { getMockInvestmentsForUser } from '../data/mockInvestments.js';
import { findMarketInstrument } from '../data/mockMarket.js';
import {
  addTransaction,
  ensureAccountData,
} from './accountStore.js';
import { notifyDataChanged } from '../services/purchaseSimulator.js';

const STORAGE_PREFIX = 'ha-bank-invest-v2:';

/**
 * @typedef {{
 *   id: string,
 *   symbol?: string,
 *   name: string,
 *   type: string,
 *   value: number,
 *   costBasis: number,
 *   dailyChangePercent: number
 * }} StoredHolding
 *
 * @typedef {{
 *   holdings: StoredHolding[],
 *   watchlist: string[]
 * }} InvestmentsData
 */

/**
 * @param {string} userId
 * @returns {string}
 */
function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * @param {string} name
 * @returns {string}
 */
function guessSymbol(name) {
  if (/S&P|ס.?פ/i.test(name)) return 'SPX.IL';
  if (/זהב/.test(name)) return 'GOLD.IL';
  if (/קרן\s*אג.?ח\s*קונצרני/.test(name)) return 'CORPF.IL';
  if (/אג.?ח\s*קונצרני/.test(name)) return 'CORP.IL';
  if (/אג.?ח|ממשלתי/.test(name)) return 'GOV.IL';
  if (/ת.?א|125/.test(name)) return 'TA125';
  if (/טכנולוג/.test(name)) return 'TECH.IL';
  if (/נדל/.test(name)) return 'REIT.IL';
  if (/אירו/.test(name)) return 'EUR.ILS';
  if (/דולר|מט.?ח/.test(name)) return 'USD.ILS';
  if (/בנק/.test(name)) return 'BNK.IL';
  if (/פיקדון/.test(name)) return 'DEP.IL';
  if (/גלובל/.test(name)) return 'GLB.IL';
  if (/מדד\s*עולמי/.test(name)) return 'WRLD.IL';
  if (/שמרני/.test(name)) return 'CONS.IL';
  if (/צמיחה/.test(name)) return 'GRW.IL';
  return name.slice(0, 4).toUpperCase();
}

/**
 * משלים עלות קנייה להחזקה ישנה בלי costBasis.
 * @param {object} item
 * @returns {StoredHolding}
 */
function normalizeHolding(item) {
  const value = Number(item.value) || 0;
  let costBasis = Number(item.costBasis);

  if (!Number.isFinite(costBasis) || costBasis < 0) {
    const gainPct = Number(item.purchaseGainPercent);
    costBasis = Number.isFinite(gainPct)
      ? Number((value / (1 + gainPct / 100)).toFixed(2))
      : Number((value / 1.06).toFixed(2));
  }

  return {
    id: String(item.id || `inv-${Date.now()}`),
    symbol: item.symbol || guessSymbol(String(item.name || '')),
    name: String(item.name || ''),
    type: String(item.type || ''),
    value,
    costBasis,
    dailyChangePercent: Number(item.dailyChangePercent) || 0,
  };
}

/**
 * @param {string} userId
 * @returns {InvestmentsData | null}
 */
function createSeed(userId) {
  const raw = getMockInvestmentsForUser(userId);

  return {
    holdings: (raw?.holdings || []).map((item) => normalizeHolding(item)),
    watchlist: [],
  };
}

/**
 * @param {string} userId
 * @returns {InvestmentsData | null}
 */
export function getInvestmentsData(userId) {
  if (!userId) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.holdings)) {
      return null;
    }

    return {
      holdings: parsed.holdings.map((item) => normalizeHolding(item)),
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} userId
 * @param {InvestmentsData} data
 */
export function saveInvestmentsData(userId, data) {
  window.localStorage.setItem(
    storageKey(userId),
    JSON.stringify({
      holdings: data.holdings.map((item) => normalizeHolding(item)),
      watchlist: data.watchlist,
    }),
  );
}

/**
 * @param {string} userId
 * @returns {InvestmentsData | null}
 */
export function ensureInvestmentsData(userId) {
  const existing = getInvestmentsData(userId);

  if (existing) {
    // שומר נרמול costBasis להחזקות ישנות
    saveInvestmentsData(userId, existing);
    return existing;
  }

  const seed = createSeed(userId);

  if (!seed) {
    return null;
  }

  saveInvestmentsData(userId, seed);
  return seed;
}

/**
 * @param {string} userId
 * @returns {StoredHolding[]}
 */
export function listHoldings(userId) {
  return ensureInvestmentsData(userId)?.holdings || [];
}

/**
 * @param {string} userId
 * @returns {string[]}
 */
export function listWatchlist(userId) {
  return ensureInvestmentsData(userId)?.watchlist || [];
}

/**
 * @param {string} userId
 * @param {string} marketId
 * @returns {string[]}
 */
export function toggleWatchlist(userId, marketId) {
  const data = ensureInvestmentsData(userId);

  if (!data) {
    return [];
  }

  if (data.watchlist.includes(marketId)) {
    data.watchlist = data.watchlist.filter((id) => id !== marketId);
  } else {
    data.watchlist = [...data.watchlist, marketId];
  }

  saveInvestmentsData(userId, data);
  return data.watchlist;
}

/**
 * קנייה — מוריד מהעו״ש ומוסיף לתיק (ערך + עלות קנייה).
 * @param {string} userId
 * @param {{ marketId?: string, holdingId?: string, amount: number }} input
 * @returns {{ ok: boolean, error?: string }}
 */
export function buyInvestment(userId, input) {
  const amount = Number(input.amount);

  if (!Number.isFinite(amount) || amount < 50) {
    return { ok: false, error: 'סכום מינימום לקנייה: ₪50' };
  }

  const data = ensureInvestmentsData(userId);
  const account = ensureAccountData(userId);

  if (!data || !account) {
    return { ok: false, error: 'אין תיק או חשבון למשתמש' };
  }

  if (account.balance < amount) {
    return { ok: false, error: 'אין מספיק יתרה בעו״ש' };
  }

  if (input.holdingId) {
    const holding = data.holdings.find((item) => item.id === input.holdingId);

    if (!holding) {
      return { ok: false, error: 'החזקה לא נמצאה' };
    }

    holding.value = Number((holding.value + amount).toFixed(2));
    holding.costBasis = Number((holding.costBasis + amount).toFixed(2));
  } else if (input.marketId) {
    const market = findMarketInstrument(input.marketId);

    if (!market) {
      return { ok: false, error: 'מכשיר לא נמצא בשוק' };
    }

    const existing = data.holdings.find(
      (item) => item.symbol === market.symbol || item.name === market.name,
    );

    if (existing) {
      existing.value = Number((existing.value + amount).toFixed(2));
      existing.costBasis = Number((existing.costBasis + amount).toFixed(2));
      existing.dailyChangePercent = market.dailyChangePercent;
    } else {
      data.holdings.push({
        id: `inv-${Date.now()}`,
        symbol: market.symbol,
        name: market.name,
        type: market.type,
        value: amount,
        costBasis: amount,
        dailyChangePercent: market.dailyChangePercent,
      });
    }
  } else {
    return { ok: false, error: 'חסר יעד קנייה' };
  }

  const charged = addTransaction(userId, {
    date: new Date().toISOString().slice(0, 10),
    description: 'רכישת השקעה',
    amount: -amount,
    category: 'השקעות',
  });

  if (!charged) {
    return { ok: false, error: 'לא ניתן לחייב את העו״ש' };
  }

  saveInvestmentsData(userId, data);
  notifyDataChanged({ type: 'investments', userId });
  return { ok: true };
}

/**
 * מכירה — מחזיר לעו״ש ומקטין ערך + עלות קנייה באופן יחסי.
 * @param {string} userId
 * @param {{ holdingId: string, amount: number }} input
 * @returns {{ ok: boolean, error?: string }}
 */
export function sellInvestment(userId, input) {
  const amount = Number(input.amount);

  if (!Number.isFinite(amount) || amount < 50) {
    return { ok: false, error: 'סכום מינימום למכירה: ₪50' };
  }

  const data = ensureInvestmentsData(userId);

  if (!data) {
    return { ok: false, error: 'אין תיק למשתמש' };
  }

  const holding = data.holdings.find((item) => item.id === input.holdingId);

  if (!holding) {
    return { ok: false, error: 'החזקה לא נמצאה' };
  }

  if (amount > holding.value) {
    return { ok: false, error: 'אי אפשר למכור יותר משווי ההחזקה' };
  }

  const prevValue = holding.value;
  const costSold = prevValue > 0
    ? Number(((holding.costBasis * amount) / prevValue).toFixed(2))
    : 0;

  holding.value = Number((holding.value - amount).toFixed(2));
  holding.costBasis = Number(Math.max(0, holding.costBasis - costSold).toFixed(2));

  if (holding.value < 1) {
    data.holdings = data.holdings.filter((item) => item.id !== holding.id);
  }

  const account = addTransaction(userId, {
    date: new Date().toISOString().slice(0, 10),
    description: 'מכירת השקעה',
    amount,
    category: 'השקעות',
  });

  if (!account) {
    return { ok: false, error: 'לא ניתן להפקיד לעו״ש' };
  }

  saveInvestmentsData(userId, data);
  notifyDataChanged({ type: 'investments', userId });
  return { ok: true };
}

/**
 * מדמה תנודת שוק יומית — מעדכן ערך נוכחי, עלות הקנייה נשארת.
 * @param {string} userId
 * @returns {InvestmentsData | null}
 */
export function simulateMarketTick(userId) {
  const data = ensureInvestmentsData(userId);

  if (!data) {
    return null;
  }

  data.holdings = data.holdings.map((holding) => {
    const drift = Math.random() * 2.4 - 1.2;
    const nextPct = Number(
      Math.max(-4, Math.min(4, (Number(holding.dailyChangePercent) || 0) * 0.35 + drift)).toFixed(2),
    );
    const nextValue = Number(
      (holding.value * (1 + nextPct / 100)).toFixed(2),
    );

    return {
      ...holding,
      value: Math.max(0, nextValue),
      costBasis: holding.costBasis,
      dailyChangePercent: nextPct,
    };
  });

  saveInvestmentsData(userId, data);
  notifyDataChanged({ type: 'investments-tick', userId });
  return data;
}
