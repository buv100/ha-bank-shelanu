/**
 * שכבת API לצ׳אט —
 * קוראת ל־Worker אם מוגדר, אחרת נופלת לתשובות דמה.
 */

import { getMockChatReply } from '../data/chatMock.js';

/**
 * שולח הודעה לבוט ומחזיר תשובה + פעולה אופציונלית.
 * @param {{
 *   message: string,
 *   allowSensitive: boolean,
 *   history: Array<{ role: 'user' | 'assistant', content: string }>
 * }} payload
 * @returns {Promise<{ reply: string, action?: string, needsSensitiveConsent?: boolean, source: 'api' | 'mock' }>}
 */
export async function sendChatMessage(payload) {
  const apiUrl = import.meta.env.VITE_CHAT_API_URL;

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: payload.message,
          allowSensitive: payload.allowSensitive,
          history: payload.history,
        }),
      });

      if (!response.ok) {
        throw new Error(`chat api ${response.status}`);
      }

      const data = await response.json();

      return {
        reply: String(data.reply || ''),
        action: data.action ? String(data.action) : undefined,
        needsSensitiveConsent: Boolean(data.needsSensitiveConsent),
        source: 'api',
      };
    } catch {
      // נופלים לדמה בשקט — הדמו תמיד נשאר שמיש
    }
  }

  const mock = getMockChatReply(payload.message, {
    allowSensitive: payload.allowSensitive,
  });

  // מדמים השהייה קלה כמו תשובת רשת
  await new Promise((resolve) => {
    window.setTimeout(resolve, 450 + Math.random() * 400);
  });

  return { ...mock, source: 'mock' };
}
