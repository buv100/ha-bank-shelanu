/**
 * תשובות מקומיות ליועץ השקעות — כשאין API או לשאלות ספציפיות.
 */

import { MARKET_INSTRUMENTS } from './mockMarket.js';
import { getInvestmentsSummary } from '../utils/investments.js';
import { formatCurrency, formatSignedPercent } from '../utils/format.js';

/**
 * @param {string} text
 * @returns {string}
 */
export function detectInvestChatIntent(text) {
  const t = text.toLowerCase();

  if (/המלצ.*יום|מה\s*לקנות\s*היום|המלצה\s*יומית|daily\s*pick|מה\s*כדאי\s*היום/.test(t)) {
    return 'daily_pick';
  }

  if (/התיק\s*שלי|השקעות\s*שלי|האם.*(טוב|בסדר)|ניתוח\s*תיק|portfolio/.test(t)) {
    return 'portfolio_review';
  }

  if (/במה\s*להשקיע|מה\s*לקנות|המלצ|איפה\s*לשים|diversif|פיזור/.test(t)) {
    return 'what_to_buy';
  }

  if (/עזר|help|מה\s*אתה\s*יכול/.test(t)) {
    return 'help';
  }

  return 'general';
}

/**
 * @returns {{ reply: string, preferLocal?: boolean }}
 */
function getDailyPickReply() {
  const ranked = [...MARKET_INSTRUMENTS].sort(
    (a, b) => b.dailyChangePercent - a.dailyChangePercent,
  );
  const top = ranked[0];
  const second = ranked[1];

  if (!top) {
    return { reply: 'אין כרגע מכשירים בלוח השוק.', preferLocal: true };
  }

  return {
    reply: `המלצת היום בדמו: ${top.name} (${top.symbol}) עם ${formatSignedPercent(top.dailyChangePercent)} היום. חלופה: ${second ? `${second.name} (${formatSignedPercent(second.dailyChangePercent)})` : 'אין'}. זה סימולציה — לא ייעוץ אמיתי.`,
    preferLocal: true,
  };
}

/**
 * @returns {{ reply: string, preferLocal?: boolean }}
 */
function getPortfolioReviewReply() {
  const summary = getInvestmentsSummary();

  if (!summary?.holdings?.length) {
    return {
      reply: 'התיק ריק כרגע. אפשר להתחיל מקנייה בדף החיפוש, או לבקש המלצה יומית.',
      preferLocal: true,
    };
  }

  const best = [...summary.holdings].sort(
    (a, b) => b.purchaseProfitPercent - a.purchaseProfitPercent,
  )[0];
  const worst = [...summary.holdings].sort(
    (a, b) => a.purchaseProfitPercent - b.purchaseProfitPercent,
  )[0];

  return {
    reply: `התיק שווה ${formatCurrency(summary.totalValue)}, רווח מקנייה ${formatSignedPercent(summary.purchaseProfitPercent)} ושינוי יומי ${formatSignedPercent(summary.dailyChangePercent)}. חזק יחסית: ${best.name}. חלש יחסית: ${worst.name}. לפפיזור — בדקו אם יש ריכוז יתר בסוג אחד.`,
    preferLocal: true,
  };
}

/**
 * @returns {{ reply: string, preferLocal?: boolean }}
 */
function getWhatToBuyReply() {
  const summary = getInvestmentsSummary();
  const types = new Set((summary?.holdings || []).map((h) => h.type));
  const missing = MARKET_INSTRUMENTS.filter((item) => !types.has(item.type));
  const pick = missing[0] || [...MARKET_INSTRUMENTS].sort(
    (a, b) => b.dailyChangePercent - a.dailyChangePercent,
  )[0];

  if (!pick) {
    return { reply: 'אין הצעות כרגע בלוח.', preferLocal: true };
  }

  const reason = missing[0]
    ? `כדי לפזר מעבר ל־${[...types].join(', ') || 'ההחזקות הנוכחיות'}`
    : 'כי הוא מוביל בשינוי היומי בלוח הדמו';

  return {
    reply: `בדמו הייתי בוחן את ${pick.name} (${pick.type}) — ${reason}. אפשר לקנות דרך חיפוש לקנייה.`,
    preferLocal: true,
  };
}

/**
 * @param {string} userText
 * @returns {{ reply: string, preferLocal?: boolean }}
 */
export function getMockInvestChatReply(userText) {
  const intent = detectInvestChatIntent(userText);

  if (intent === 'daily_pick') {
    return getDailyPickReply();
  }

  if (intent === 'portfolio_review') {
    return getPortfolioReviewReply();
  }

  if (intent === 'what_to_buy') {
    return getWhatToBuyReply();
  }

  if (intent === 'help') {
    return {
      reply: 'אפשר לשאול: המלצה יומית, האם התיק טוב, ובמה להשקיע. זה יועץ דמו בלבד.',
      preferLocal: true,
    };
  }

  return {
    reply: 'אפשר לשאול על התיק, המלצה יומית, או במה כדאי להשקיע בדמו.',
  };
}
