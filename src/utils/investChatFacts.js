/**
 * עובדות תיק + שוק לצ׳אט ייעוץ השקעות.
 */

import { MARKET_INSTRUMENTS } from '../data/mockMarket.js';
import { getInvestmentsSummary } from './investments.js';
import { getCurrentAccount, getCurrentProfile } from './session.js';
import { formatCurrency, formatSignedPercent } from './format.js';

/**
 * @typedef {{
 *   symbol: string,
 *   name: string,
 *   type: string,
 *   unitPrice: number,
 *   dailyChangePercent: number,
 *   reason: string
 * }} DailyPick
 */

/**
 * המלצה יומית — מוביל שינוי חיובי שאינו כבר רוב התיק.
 * @returns {DailyPick | null}
 */
export function getDailyInvestmentPick() {
  const summary = getInvestmentsSummary();
  const ownedNames = new Set(
    (summary?.holdings || []).map((h) => h.name),
  );

  const ranked = MARKET_INSTRUMENTS.slice().sort(
    (a, b) =>
      (Number(b.dailyChangePercent) || 0) - (Number(a.dailyChangePercent) || 0),
  );

  const freshLeader = ranked.find(
    (item) =>
      (Number(item.dailyChangePercent) || 0) > 0 && !ownedNames.has(item.name),
  );
  const pick = freshLeader || ranked[0];

  if (!pick) {
    return null;
  }

  return {
    symbol: pick.symbol,
    name: pick.name,
    type: pick.type,
    unitPrice: pick.unitPrice,
    dailyChangePercent: pick.dailyChangePercent,
    reason: ownedNames.has(pick.name)
      ? 'המוביל בשינוי היומי בלוח (כבר בתיק — אפשר להוסיף או לגוון).'
      : 'המוביל בשינוי היומי שאינו בתיק כרגע — לפי דמו השוק.',
  };
}

/**
 * טקסט עובדות לפרומפט יועץ ההשקעות.
 * @returns {string}
 */
export function formatInvestChatFacts() {
  const profile = getCurrentProfile();
  const cash = getCurrentAccount()?.balance || 0;
  const summary = getInvestmentsSummary();
  const pick = getDailyInvestmentPick();
  const lines = [
    '=== צילום תיק מסחר בדמו (מקור אמת) ===',
    `לקוח: ${profile?.fullName || 'לא ידוע'}`,
    `מזומן בעו״ש לזמין לקנייה: ${cash}`,
  ];

  if (!summary || summary.holdings.length === 0) {
    lines.push('תיק החזקות: ריק');
  } else {
    lines.push(`שווי תיק: ${summary.totalValue}`);
    lines.push(`עלות קנייה כוללת: ${summary.totalCostBasis}`);
    lines.push(
      `רווח מקנייה: ${summary.purchaseProfit} (${summary.purchaseProfitPercent}%)`,
    );
    lines.push(
      `שינוי יומי בתיק: ${summary.dailyChangePercent}% (${summary.dailyChangeAmount})`,
    );
    lines.push('החזקות:');
    summary.holdings.forEach((h) => {
      lines.push(
        `  - ${h.name} (${h.type}): שווי ${h.value}, עלות ${h.costBasis}, יומי ${h.dailyChangePercent}%, מקנייה ${h.purchaseProfit} (${h.purchaseProfitPercent}%), משקל ${h.weightPercent}%`,
      );
    });
  }

  lines.push('לוח שוק (לקנייה):');
  MARKET_INSTRUMENTS.forEach((item) => {
    lines.push(
      `  - ${item.symbol} | ${item.name} | ${item.type} | מחיר ${item.unitPrice} | יומי ${item.dailyChangePercent}%`,
    );
  });

  if (pick) {
    lines.push('המלצה יומית מחושבת בדמו:');
    lines.push(
      `  ${pick.symbol} · ${pick.name} · ${pick.type} · ${pick.dailyChangePercent}% · ${pick.reason}`,
    );
  }

  lines.push(
    'הערה: זה דמו ללמידה — לא ייעוץ השקעות אמיתי ולא המלצה לקנייה בשוק אמיתי.',
  );

  return lines.join('\n');
}

/**
 * תשובה מקומית קצרה להמלצה יומית.
 * @returns {string}
 */
export function getLocalDailyPickReply() {
  const pick = getDailyInvestmentPick();

  if (!pick) {
    return 'אין כרגע המלצה יומית בלוח הדמו.';
  }

  return `המלצה יומית בדמו: ${pick.name} (${pick.symbol}) · ${formatSignedPercent(pick.dailyChangePercent)} היום · מחיר ייחוס ${formatCurrency(pick.unitPrice)}. ${pick.reason} זה דמו בלבד — לא ייעוץ אמיתי.`;
}

/**
 * תשובה מקומית לסקירת תיק.
 * @returns {string}
 */
export function getLocalPortfolioReviewReply() {
  const summary = getInvestmentsSummary();

  if (!summary || summary.holdings.length === 0) {
    return 'התיק ריק כרגע. אפשר להתחיל מחיפוש לקנייה, או לבקש ממני המלצה יומית.';
  }

  const tone =
    summary.purchaseProfit > 0
      ? 'בסך הכל התיק ברווח מקנייה'
      : summary.purchaseProfit < 0
        ? 'בסך הכל התיק בהפסד מקנייה'
        : 'התיק מאוזן סביב עלות הקנייה';

  const daily =
    summary.dailyChangePercent > 0
      ? 'והיום הוא חיובי'
      : summary.dailyChangePercent < 0
        ? 'והיום הוא שלילי'
        : 'והיום הוא שטוח';

  const top = summary.holdings.slice().sort(
    (a, b) => b.weightPercent - a.weightPercent,
  )[0];

  return `${tone} (${formatCurrency(summary.purchaseProfit)}, ${formatSignedPercent(summary.purchaseProfitPercent)}) ${daily} (${formatSignedPercent(summary.dailyChangePercent)}). ההחזקה הכבדה ביותר: ${top.name} (${top.weightPercent}%). לגוון — חפשו בקטגוריה אחרת בחיפוש לקנייה. דמו בלבד.`;
}
