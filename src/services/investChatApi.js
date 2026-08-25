/**
 * API לצ׳אט ייעוץ השקעות — נפרד מצ׳אט הבנק.
 */

import {
  formatInvestChatFacts,
  getLocalDailyPickReply,
  getLocalPortfolioReviewReply,
} from '../utils/investChatFacts.js';

/**
 * @param {string} message
 * @returns {{ reply: string, preferLocal: boolean } | null}
 */
function getLocalInvestReply(message) {
  const t = message.toLowerCase();

  if (/המלצ.*יומ|מה\s*לקנו|מה\s*כדאי\s*לקנ|daily\s*pick|המלצה\s*להיום/.test(t)) {
    return { reply: getLocalDailyPickReply(), preferLocal: true };
  }

  if (
    /השקעות\s*שלי|התיק\s*שלי|האם.*טוב|סקיר.*תיק|איך\s*התיק|portfolio/.test(t)
  ) {
    return { reply: getLocalPortfolioReviewReply(), preferLocal: true };
  }

  return null;
}

/**
 * @param {{
 *   message: string,
 *   history: Array<{ role: 'user' | 'assistant', content: string }>
 * }} payload
 * @returns {Promise<{ reply: string, source: 'api' | 'mock' }>}
 */
export async function sendInvestChatMessage(payload) {
  const local = getLocalInvestReply(payload.message);

  // המלצה יומית / סקירת תיק — תשובה דטרמיניסטית מהתיק
  if (local?.preferLocal) {
    return { reply: local.reply, source: 'mock' };
  }

  const factsText = formatInvestChatFacts();
  const apiUrl = import.meta.env.VITE_INVEST_CHAT_API_URL || '/api/invest-chat';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: payload.message,
        history: payload.history,
        investFactsText: factsText,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(String(data.detail || data.error || response.status));
    }

    const apiReply = String(data.reply || '').trim();

    if (apiReply) {
      return { reply: apiReply, source: 'api' };
    }
  } catch (error) {
    console.warn('[investChatApi] fallback:', error);
  }

  if (local) {
    return { reply: local.reply, source: 'mock' };
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, 280);
  });

  return {
    reply:
      'אפשר לשאול על התיק, המלצה יומית, או במה לגוון — לפי נתוני הדמו בלבד. זה לא ייעוץ השקעות אמיתי.',
    source: 'mock',
  };
}
