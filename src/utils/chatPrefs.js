/**
 * העדפות והסכמות לצ׳אט AI (סשן בלבד לדמו).
 */

const AI_CONSENT_KEY = 'ha-bank-chat-ai-consent';

/**
 * האם המשתמש אישר שימוש בצ׳אט AI בסשן הנוכחי.
 * @returns {boolean}
 */
export function hasAiChatConsent() {
  return window.sessionStorage.getItem(AI_CONSENT_KEY) === '1';
}

/**
 * שומר הסכמה לשימוש בצ׳אט AI.
 */
export function setAiChatConsent() {
  window.sessionStorage.setItem(AI_CONSENT_KEY, '1');
}

/** מגבלת תווים להודעת משתמש */
export const CHAT_MAX_MESSAGE_LENGTH = 500;

/** מגבלת הודעות בשיחה אחת (לפני סגירה ב־X) */
export const CHAT_MAX_MESSAGES = 40;
