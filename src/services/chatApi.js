/**
 * שכבת API לצ׳אט —
 * קוראת ל־Groq דרך /api/chat (או Worker), אחרת נופלת לתשובות דמה.
 * פעולות בנקאיות (כרטיס/ניווט) ממשיכות מהזיהוי המקומי.
 */

import { getMockChatReply } from '../data/chatMock.js';
import {
  buildChatAccountFacts,
  formatAccountFactsForPrompt,
} from '../utils/chatAccountFacts.js';

/**
 * ממזג תשובת API עם פעולות מקומיות לדמו הבנקאי.
 * @param {{ reply?: string }} apiData
 * @param {{ message: string, allowSensitive: boolean }} payload
 * @returns {{
 *   reply: string,
 *   action?: string,
 *   needsSensitiveConsent?: boolean,
 *   cardChoices?: Array<{ id: string, label: string, lastFour: string }>,
 *   cardId?: string,
 *   pendingCardReveal?: boolean,
 *   source: 'api'
 * }}
 */
function mergeApiWithLocalActions(apiData, payload) {
  const local = getMockChatReply(payload.message, {
    allowSensitive: payload.allowSensitive,
  });
  const apiReply = String(apiData.reply || '').trim();

  // זרימות רגישות/כרטיס/מספרים מהחשבון — מקומי בלבד (לא ממציאים)
  if (
    local.preferLocal ||
    local.needsSensitiveConsent ||
    local.cardChoices ||
    local.action === 'choose_card' ||
    local.action === 'show_card_details'
  ) {
    return { ...local, source: 'api' };
  }

  // תשובת Groq קודמת — שיחה פתוחה
  if (apiReply) {
    return {
      reply: apiReply,
      action: local.action,
      cardId: local.cardId,
      source: 'api',
    };
  }

  return {
    reply: local.reply || 'לא הצלחתי לענות כרגע.',
    action: local.action,
    cardId: local.cardId,
    source: 'api',
  };
}

/**
 * שולח הודעה לבוט ומחזיר תשובה + פעולה אופציונלית.
 * @param {{
 *   message: string,
 *   allowSensitive: boolean,
 *   history: Array<{ role: 'user' | 'assistant', content: string }>
 * }} payload
 * @returns {Promise<{
 *   reply: string,
 *   action?: string,
 *   needsSensitiveConsent?: boolean,
 *   cardChoices?: Array<{ id: string, label: string, lastFour: string }>,
 *   cardId?: string,
 *   source: 'api' | 'mock'
 * }>}
 */
export async function sendChatMessage(payload) {
  const apiUrl = import.meta.env.VITE_CHAT_API_URL || '/api/chat';
  const accountFacts = payload.allowSensitive ? buildChatAccountFacts() : null;
  const accountFactsText = accountFacts
    ? formatAccountFactsForPrompt(accountFacts)
    : null;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: payload.message,
        allowSensitive: payload.allowSensitive,
        history: payload.history,
        accountFacts,
        accountFactsText,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = String(data.detail || data.error || '');

      if (
        response.status === 401 ||
        response.status === 403 ||
        /invalid.?api.?key|permission|rate.?limit|quota/i.test(detail)
      ) {
        const local = getMockChatReply(payload.message, {
          allowSensitive: payload.allowSensitive,
        });

        return {
          ...local,
          reply:
            `${local.reply}\n\n(הערה: העוזר החכם לא זמין כרגע — בדקו את מפתח Groq ב־.env.)`,
          source: 'mock',
        };
      }

      throw new Error(`chat api ${response.status}: ${detail.slice(0, 200)}`);
    }

    return mergeApiWithLocalActions(data, payload);
  } catch (error) {
    console.warn('[chatApi] fallback to mock:', error);
  }

  const mock = getMockChatReply(payload.message, {
    allowSensitive: payload.allowSensitive,
  });

  await new Promise((resolve) => {
    window.setTimeout(resolve, 350 + Math.random() * 300);
  });

  return { ...mock, source: 'mock' };
}
