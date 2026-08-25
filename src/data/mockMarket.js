/**
 * מכשירים זמינים למסחר בדמו (לוח שוק).
 */

/** @typedef {{
 *   id: string,
 *   symbol: string,
 *   name: string,
 *   type: string,
 *   unitPrice: number,
 *   dailyChangePercent: number
 * }} MarketInstrument */

/**
 * @typedef {{
 *   marketId: string,
 *   description: string,
 *   risk: string,
 *   currency: string,
 *   exchange: string,
 *   expenseRatioPercent: number,
 *   ytdPercent: number,
 *   year1Percent: number,
 *   weekChangePercent: number[],
 *   tags: string[]
 * }} InstrumentProfile
 */

/** @type {MarketInstrument[]} */
export const MARKET_INSTRUMENTS = [
  {
    id: 'mkt-spx',
    symbol: 'SPX.IL',
    name: 'קרן מחקה S&P 500',
    type: 'קרן סל',
    unitPrice: 142.5,
    dailyChangePercent: 1.42,
  },
  {
    id: 'mkt-gold',
    symbol: 'GOLD.IL',
    name: 'תעודת זהב',
    type: 'סחורה',
    unitPrice: 86.2,
    dailyChangePercent: -0.65,
  },
  {
    id: 'mkt-gov',
    symbol: 'GOV.IL',
    name: 'אג״ח ממשלתי',
    type: 'אג״ח',
    unitPrice: 101.4,
    dailyChangePercent: 0.18,
  },
  {
    id: 'mkt-ta',
    symbol: 'TA125',
    name: 'מדד ת״א 125',
    type: 'קרן סל',
    unitPrice: 58.9,
    dailyChangePercent: -1.15,
  },
  {
    id: 'mkt-tech',
    symbol: 'TECH.IL',
    name: 'קרן טכנולוגיה',
    type: 'קרן נאמנות',
    unitPrice: 74.3,
    dailyChangePercent: 2.05,
  },
  {
    id: 'mkt-re',
    symbol: 'REIT.IL',
    name: 'קרן נדל״ן',
    type: 'קרן סל',
    unitPrice: 41.7,
    dailyChangePercent: 1.1,
  },
  {
    id: 'mkt-fx',
    symbol: 'USD.ILS',
    name: 'דולר / מט״ח',
    type: 'מט״ח',
    unitPrice: 3.72,
    dailyChangePercent: -0.8,
  },
  {
    id: 'mkt-bank',
    symbol: 'BNK.IL',
    name: 'מניות בנקים',
    type: 'מניות',
    unitPrice: 29.6,
    dailyChangePercent: -0.42,
  },
  {
    id: 'mkt-energy',
    symbol: 'ENRG.IL',
    name: 'מניות אנרגיה',
    type: 'מניות',
    unitPrice: 44.8,
    dailyChangePercent: 0.75,
  },
  {
    id: 'mkt-corp',
    symbol: 'CORP.IL',
    name: 'אג״ח קונצרני',
    type: 'אג״ח',
    unitPrice: 98.1,
    dailyChangePercent: -0.12,
  },
  {
    id: 'mkt-euro',
    symbol: 'EUR.ILS',
    name: 'אירו / מט״ח',
    type: 'מט״ח',
    unitPrice: 4.05,
    dailyChangePercent: 0.22,
  },
  {
    id: 'mkt-deposit',
    symbol: 'DEP.IL',
    name: 'פיקדון מנוהל',
    type: 'פיקדון',
    unitPrice: 100,
    dailyChangePercent: 0.04,
  },
  {
    id: 'mkt-global',
    symbol: 'GLB.IL',
    name: 'קרן גלובלית',
    type: 'קרן נאמנות',
    unitPrice: 63.8,
    dailyChangePercent: 0.88,
  },
  {
    id: 'mkt-world',
    symbol: 'WRLD.IL',
    name: 'מדד עולמי',
    type: 'קרן סל',
    unitPrice: 52.4,
    dailyChangePercent: 0.55,
  },
  {
    id: 'mkt-conserv',
    symbol: 'CONS.IL',
    name: 'תיק מנוהל שמרני',
    type: 'תיק מנוהל',
    unitPrice: 105.2,
    dailyChangePercent: 0.31,
  },
  {
    id: 'mkt-growth',
    symbol: 'GRW.IL',
    name: 'מניות צמיחה',
    type: 'מניות',
    unitPrice: 38.9,
    dailyChangePercent: 1.95,
  },
  {
    id: 'mkt-corp-fund',
    symbol: 'CORPF.IL',
    name: 'קרן אג״ח קונצרני',
    type: 'אג״ח',
    unitPrice: 97.4,
    dailyChangePercent: -0.22,
  },
];

/** @type {Record<string, InstrumentProfile>} */
const INSTRUMENT_PROFILES = {
  'mkt-spx': {
    marketId: 'mkt-spx',
    description:
      'קרן סל מחקה את מדד S&P 500 — 500 החברות הגדולות בארה״ב. מתאימה לחשיפה רחבה לשוק האמריקאי בדמו.',
    risk: 'בינוני',
    currency: 'USD (מגודר/שקלי בדמו)',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.07,
    ytdPercent: 8.4,
    year1Percent: 14.2,
    weekChangePercent: [-0.4, 0.6, 0.2, -0.1, 0.9, 0.3, 1.42],
    tags: ['מדדים', 'ארה״ב', 'מניות'],
  },
  'mkt-gold': {
    marketId: 'mkt-gold',
    description:
      'תעודה העוקבת אחר מחיר הזהב. משמשת בדמו כגיוון מול מניות ואג״ח.',
    risk: 'בינוני-גבוה',
    currency: 'USD',
    exchange: 'סחורות · דמו',
    expenseRatioPercent: 0.25,
    ytdPercent: 3.1,
    year1Percent: 11.8,
    weekChangePercent: [0.2, -0.5, -0.3, 0.1, -0.8, 0.4, -0.65],
    tags: ['סחורות', 'זהב', 'גיוון'],
  },
  'mkt-gov': {
    marketId: 'mkt-gov',
    description:
      'אג״ח ממשלתי לטווח בינוני — יציבות יחסית ותנודתיות נמוכה יותר ממניות בדמו.',
    risk: 'נמוך',
    currency: 'ILS',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.05,
    ytdPercent: 1.6,
    year1Percent: 2.8,
    weekChangePercent: [0.05, 0.1, -0.02, 0.08, 0.04, 0.12, 0.18],
    tags: ['אג״ח', 'ממשלתי', 'יציבות'],
  },
  'mkt-ta': {
    marketId: 'mkt-ta',
    description:
      'קרן מחקה למדד ת״א 125 — חשיפה רחבה לשוק המקומי.',
    risk: 'בינוני',
    currency: 'ILS',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.1,
    ytdPercent: -2.4,
    year1Percent: 5.6,
    weekChangePercent: [0.3, -0.7, -0.4, 0.2, -0.9, -0.2, -1.15],
    tags: ['ישראל', 'מדדים', 'מניות'],
  },
  'mkt-tech': {
    marketId: 'mkt-tech',
    description:
      'קרן נאמנות עם דגש על חברות טכנולוגיה גלובליות — תנודתיות גבוהה יותר בדמו.',
    risk: 'גבוה',
    currency: 'USD',
    exchange: 'גלובלי · דמו',
    expenseRatioPercent: 0.85,
    ytdPercent: 12.7,
    year1Percent: 22.1,
    weekChangePercent: [1.1, -0.6, 0.8, 1.4, -0.3, 0.9, 2.05],
    tags: ['טכנולוגיה', 'צמיחה'],
  },
  'mkt-re': {
    marketId: 'mkt-re',
    description:
      'קרן סל נדל״ן (REIT) — חשיפה לנכסים מניבים בדמו.',
    risk: 'בינוני',
    currency: 'ILS',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.35,
    ytdPercent: 4.2,
    year1Percent: 7.9,
    weekChangePercent: [0.4, 0.2, -0.3, 0.6, 0.1, 0.8, 1.1],
    tags: ['נדל״ן', 'דיבידנד'],
  },
  'mkt-fx': {
    marketId: 'mkt-fx',
    description:
      'חשיפה לשער הדולר מול השקל — כלי מט״ח פשוט בדמו.',
    risk: 'בינוני',
    currency: 'USD/ILS',
    exchange: 'מט״ח · דמו',
    expenseRatioPercent: 0.15,
    ytdPercent: -1.9,
    year1Percent: 2.1,
    weekChangePercent: [-0.2, 0.1, -0.4, -0.1, 0.3, -0.5, -0.8],
    tags: ['מט״ח', 'דולר'],
  },
  'mkt-bank': {
    marketId: 'mkt-bank',
    description:
      'סל מניות בנקים מקומיים — רגיש לריבית ולמחזור הכלכלי בדמו.',
    risk: 'בינוני-גבוה',
    currency: 'ILS',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.4,
    ytdPercent: 1.1,
    year1Percent: 9.3,
    weekChangePercent: [0.2, -0.5, 0.1, -0.3, 0.4, -0.2, -0.42],
    tags: ['בנקים', 'ישראל'],
  },
  'mkt-energy': {
    marketId: 'mkt-energy',
    description:
      'חשיפה למניות אנרגיה — תנודתיות לפי מחירי נפט וגז בדמו.',
    risk: 'גבוה',
    currency: 'ILS',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.45,
    ytdPercent: 6.8,
    year1Percent: 15.4,
    weekChangePercent: [-0.3, 0.7, 0.4, -0.2, 0.9, 0.2, 0.75],
    tags: ['אנרגיה', 'סחורות'],
  },
  'mkt-corp': {
    marketId: 'mkt-corp',
    description:
      'אג״ח קונצרני בדירוגים גבוהים יחסית — תשואה מעט גבוהה מממשלתי בדמו.',
    risk: 'נמוך-בינוני',
    currency: 'ILS',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.2,
    ytdPercent: 0.9,
    year1Percent: 3.4,
    weekChangePercent: [0.02, -0.05, 0.04, -0.08, 0.01, -0.04, -0.12],
    tags: ['אג״ח', 'קונצרני'],
  },
  'mkt-euro': {
    marketId: 'mkt-euro',
    description:
      'חשיפה לשער האירו מול השקל — מט״ח בדמו.',
    risk: 'בינוני',
    currency: 'EUR/ILS',
    exchange: 'מט״ח · דמו',
    expenseRatioPercent: 0.15,
    ytdPercent: 0.4,
    year1Percent: 1.7,
    weekChangePercent: [0.1, -0.2, 0.15, 0.05, -0.1, 0.18, 0.22],
    tags: ['מט״ח', 'אירו'],
  },
  'mkt-deposit': {
    marketId: 'mkt-deposit',
    description:
      'פיקדון מנוהל בשקלים — תנודתיות נמוכה ותשואה יציבה יחסית בדמו.',
    risk: 'נמוך',
    currency: 'ILS',
    exchange: 'פיקדונות · דמו',
    expenseRatioPercent: 0.1,
    ytdPercent: 0.7,
    year1Percent: 1.2,
    weekChangePercent: [0.01, 0.02, 0.01, 0.03, 0.02, 0.03, 0.04],
    tags: ['פיקדון', 'יציבות'],
  },
  'mkt-global': {
    marketId: 'mkt-global',
    description:
      'קרן נאמנות גלובלית — פיזור בין שווקים מפותחים בדמו.',
    risk: 'בינוני',
    currency: 'USD',
    exchange: 'גלובלי · דמו',
    expenseRatioPercent: 0.55,
    ytdPercent: 6.2,
    year1Percent: 11.4,
    weekChangePercent: [0.3, -0.2, 0.4, 0.1, 0.5, 0.2, 0.88],
    tags: ['גלובלי', 'פיזור'],
  },
  'mkt-world': {
    marketId: 'mkt-world',
    description:
      'קרן מחקה מדד עולמי רחב — חשיפה למניות ברחבי העולם בדמו.',
    risk: 'בינוני',
    currency: 'USD',
    exchange: 'גלובלי · דמו',
    expenseRatioPercent: 0.12,
    ytdPercent: 4.8,
    year1Percent: 9.1,
    weekChangePercent: [0.2, -0.1, 0.3, 0.15, -0.05, 0.4, 0.55],
    tags: ['מדדים', 'עולמי'],
  },
  'mkt-conserv': {
    marketId: 'mkt-conserv',
    description:
      'תיק מנוהל שמרני — שילוב אג״ח ומניות במינון נמוך בדמו.',
    risk: 'נמוך-בינוני',
    currency: 'ILS',
    exchange: 'ניהול תיקים · דמו',
    expenseRatioPercent: 0.7,
    ytdPercent: 2.4,
    year1Percent: 5.1,
    weekChangePercent: [0.08, 0.12, -0.04, 0.15, 0.1, 0.18, 0.31],
    tags: ['מנוהל', 'שמרני'],
  },
  'mkt-growth': {
    marketId: 'mkt-growth',
    description:
      'סל מניות צמיחה — חברות בצמיחה מהירה ותנודתיות גבוהה בדמו.',
    risk: 'גבוה',
    currency: 'USD',
    exchange: 'גלובלי · דמו',
    expenseRatioPercent: 0.5,
    ytdPercent: 14.1,
    year1Percent: 22.6,
    weekChangePercent: [0.8, -0.5, 1.1, 0.6, -0.2, 1.2, 1.95],
    tags: ['מניות', 'צמיחה'],
  },
  'mkt-corp-fund': {
    marketId: 'mkt-corp-fund',
    description:
      'קרן אג״ח קונצרני — פיזור בין איגרות חוב של חברות, נפרדת מאג״ח בודד בדמו.',
    risk: 'נמוך-בינוני',
    currency: 'ILS',
    exchange: 'בורסת ת״א · דמו',
    expenseRatioPercent: 0.28,
    ytdPercent: 0.8,
    year1Percent: 3.1,
    weekChangePercent: [0.01, -0.08, 0.03, -0.1, 0.02, -0.05, -0.22],
    tags: ['אג״ח', 'קרן', 'קונצרני'],
  },
};

/**
 * @param {string} id
 * @returns {MarketInstrument | undefined}
 */
export function findMarketInstrument(id) {
  return MARKET_INSTRUMENTS.find((item) => item.id === id);
}

/**
 * @param {string} symbolOrName
 * @returns {MarketInstrument | undefined}
 */
export function findMarketBySymbolOrName(symbolOrName) {
  const key = String(symbolOrName || '').trim().toLowerCase();

  if (!key) {
    return undefined;
  }

  return MARKET_INSTRUMENTS.find(
    (item) =>
      item.symbol.toLowerCase() === key ||
      item.name.toLowerCase() === key,
  );
}

/**
 * @param {string} marketId
 * @returns {InstrumentProfile | null}
 */
export function getInstrumentProfile(marketId) {
  return INSTRUMENT_PROFILES[marketId] || null;
}

/**
 * פרופיל ברירת מחדל להחזקות בלי רשומת שוק.
 * @param {{ name: string, type: string, dailyChangePercent: number }} holding
 * @returns {InstrumentProfile}
 */
export function buildFallbackProfile(holding) {
  const daily = Number(holding.dailyChangePercent) || 0;
  return {
    marketId: '',
    description: `${holding.name} (${holding.type}) — נתון דמו מהתיק שלכם. אין מסחר אמיתי.`,
    risk: /אג.?ח|פיקדון|מנוהל שמרני/.test(holding.type + holding.name)
      ? 'נמוך-בינוני'
      : /מניות|טכנולוג|צמיחה/.test(holding.type + holding.name)
        ? 'גבוה'
        : 'בינוני',
    currency: 'ILS',
    exchange: 'דמו מקומי',
    expenseRatioPercent: 0.35,
    ytdPercent: Number((daily * 18).toFixed(1)),
    year1Percent: Number((daily * 40).toFixed(1)),
    weekChangePercent: [
      daily * 0.2,
      daily * -0.4,
      daily * 0.3,
      daily * -0.1,
      daily * 0.5,
      daily * 0.1,
      daily,
    ].map((n) => Number(n.toFixed(2))),
    tags: [holding.type, 'תיק אישי'],
  };
}
