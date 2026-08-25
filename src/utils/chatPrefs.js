/**
 * העדפות והסכמות לצ׳אט AI (סשן בלבד לדמו).
 */

const AI_CONSENT_KEY = 'ha-bank-chat-ai-consent';
const CHAT_SESSION_KEY = 'ha-bank-chat-session';

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

/**
 * @typedef {'regular' | 'sensitive'} ChatMode
 * @typedef {{ role: 'user' | 'assistant', content: string }} ChatMessage
 * @typedef {{ mode: ChatMode | null, history: ChatMessage[] }} ChatSessionState
 */

/**
 * טוען את מצב השיחה מהסשן.
 * @returns {ChatSessionState}
 */
export function loadChatSession() {
  try {
    const raw = window.sessionStorage.getItem(CHAT_SESSION_KEY);

    if (!raw) {
      return { mode: null, history: [] };
    }

    const parsed = JSON.parse(raw);
    const mode = parsed.mode === 'regular' || parsed.mode === 'sensitive' ? parsed.mode : null;
    const history = Array.isArray(parsed.history)
      ? parsed.history
          .filter(
            (item) =>
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string',
          )
          .map((item) => ({ role: item.role, content: item.content }))
      : [];

    return { mode, history };
  } catch {
    return { mode: null, history: [] };
  }
}

/**
 * שומר את מצב השיחה בסשן.
 * @param {ChatSessionState} state
 */
export function saveChatSession(state) {
  window.sessionStorage.setItem(
    CHAT_SESSION_KEY,
    JSON.stringify({
      mode: state.mode,
      history: state.history.slice(-CHAT_MAX_MESSAGES * 2),
    }),
  );
}

/**
 * מוחק את מצב השיחה מהסשן.
 */
export function clearChatSession() {
  window.sessionStorage.removeItem(CHAT_SESSION_KEY);
}

/** מגבלת תווים להודעת משתמש */
export const CHAT_MAX_MESSAGE_LENGTH = 500;

/** מגבלת הודעות משתמש בשיחה אחת */
export const CHAT_MAX_MESSAGES = 40;
