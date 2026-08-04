/**
 * ווידג׳ט צ׳אט — FAB מרחף + פאנל קטן שניתן להרחבה.
 * היסטוריה נמחקת בסגירה (X). בלי מפתח API משתמשים בתשובות דמה.
 */

import { PRIVACY_PAGE } from './navigation.js';
import { runChatAction } from '../services/chatActions.js';
import { sendChatMessage } from '../services/chatApi.js';
import {
  CHAT_MAX_MESSAGE_LENGTH,
  CHAT_MAX_MESSAGES,
  hasAiChatConsent,
  setAiChatConsent,
} from '../utils/chatPrefs.js';
import { getCurrentProfile } from '../utils/session.js';

/** האם אושרו פרטים רגישים בשיחה הנוכחית (מתאפס בסגירה) */
let allowSensitive = false;

/** היסטוריית הודעות לשיחה הפתוחה */
/** @type {Array<{ role: 'user' | 'assistant', content: string }>} */
let history = [];

/**
 * שם הבוט לפי המשתמש המחובר בדמו.
 * @returns {string}
 */
function getBotName() {
  const profile = getCurrentProfile();
  return profile ? `הבנקאי של ${profile.fullName}` : 'הבנקאי';
}

/**
 * בונה את ה־HTML של הווידג׳ט (מוסתר בהתחלה מלבד FAB).
 * @returns {string}
 */
export function getChatWidgetMarkup() {
  const botName = getBotName();

  return `
    <div id="chat-root" class="chat-root">
      <button
        id="chat-fab"
        class="chat-fab"
        type="button"
        aria-label="פתח צ׳אט עם ${botName}"
        title="${botName}"
      >
        <span class="chat-fab__glow" aria-hidden="true"></span>
        <span class="chat-fab__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 3.5V6.5z"/>
          </svg>
        </span>
      </button>

      <section
        id="chat-panel"
        class="chat-panel"
        hidden
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-panel-title"
      >
        <header class="chat-panel__header">
          <div class="chat-panel__titles">
            <h2 id="chat-panel-title" class="chat-panel__title">${botName}</h2>
            <p class="chat-panel__disclaimer">AI · דמו · לא ייעוץ פיננסי</p>
          </div>
          <div class="chat-panel__tools">
            <button id="chat-enlarge" class="chat-tool" type="button" aria-label="הגדל חלון" title="הגדל">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 15v6h-6"/>
              </svg>
            </button>
            <button id="chat-close" class="chat-tool" type="button" aria-label="סגור צ׳אט" title="סגור">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>
        </header>

        <div id="chat-consent" class="chat-consent" hidden>
          <p class="chat-consent__text">
            הצ׳אט משתמש בבינה מלאכותית (כשמוגדר API). הודעות עשויות להישלח לספק חיצוני.
            ראו
            <a href="${PRIVACY_PAGE}" target="_blank" rel="noopener noreferrer">מדיניות פרטיות</a>.
            זה דמו בלבד — לא בנק אמיתי ולא ייעוץ.
          </p>
          <button id="chat-consent-accept" class="chat-consent__btn" type="button">אני מאשר/ת וממשיך/ה</button>
        </div>

        <div id="chat-messages" class="chat-messages" aria-live="polite"></div>

        <div id="chat-sensitive-bar" class="chat-sensitive" hidden>
          <p class="chat-sensitive__text">לאשר הצגת פרטים רגישים (יתרה / כרטיס מלא) בשיחה זו?</p>
          <div class="chat-sensitive__actions">
            <button id="chat-sensitive-yes" class="chat-sensitive__btn chat-sensitive__btn--yes" type="button">מאשר/ת</button>
            <button id="chat-sensitive-no" class="chat-sensitive__btn" type="button">לא עכשיו</button>
          </div>
        </div>

        <form id="chat-form" class="chat-form">
          <label class="visually-hidden" for="chat-input">הודעה לצ׳אט</label>
          <textarea
            id="chat-input"
            class="chat-input"
            rows="1"
            maxlength="${CHAT_MAX_MESSAGE_LENGTH}"
            placeholder="שאלו על יתרה, כרטיסים או מעבר לדף…"
          ></textarea>
          <button id="chat-send" class="chat-send" type="submit" aria-label="שלח">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 12l15-7-5 14-2-6-8-1z"/>
            </svg>
          </button>
        </form>
      </section>
    </div>
  `;
}

/**
 * מוסיף הודעה לרשימה ולמסך.
 * @param {'user' | 'assistant'} role
 * @param {string} content
 * @param {{ isTyping?: boolean }} [options]
 */
function appendMessage(role, content, options = {}) {
  const list = document.getElementById('chat-messages');

  if (!list) {
    return;
  }

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble--${role}${options.isTyping ? ' chat-bubble--typing' : ''}`;

  if (options.isTyping) {
    bubble.id = 'chat-typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    bubble.setAttribute('aria-label', 'הבוט כותב');
  } else {
    bubble.textContent = content;
  }

  list.appendChild(bubble);
  list.scrollTop = list.scrollHeight;

  if (!options.isTyping) {
    history.push({ role, content });
  }
}

/**
 * מסיר אינדיקטור כתיבה.
 */
function removeTyping() {
  document.getElementById('chat-typing')?.remove();
}

/**
 * מאתחל שיחה חדשה עם ברכה.
 */
function startFreshConversation() {
  history = [];
  allowSensitive = false;
  const list = document.getElementById('chat-messages');
  const sensitive = document.getElementById('chat-sensitive-bar');

  if (list) {
    list.innerHTML = '';
  }

  if (sensitive) {
    sensitive.hidden = true;
  }

  const firstName = getCurrentProfile()?.fullName?.split(' ')[0] || 'שם';
  appendMessage('assistant', `שלום ${firstName}, אשמח לעזור`);
}

/**
 * פותח את הפאנל (אחרי בדיקת הסכמה).
 */
function openPanel() {
  const panel = document.getElementById('chat-panel');
  const fab = document.getElementById('chat-fab');
  const consent = document.getElementById('chat-consent');
  const form = document.getElementById('chat-form');

  if (!panel || !fab) {
    return;
  }

  panel.hidden = false;
  fab.hidden = true;
  panel.classList.remove('chat-panel--expanded');

  if (!hasAiChatConsent()) {
    if (consent) {
      consent.hidden = false;
    }
    if (form) {
      form.hidden = true;
    }
    document.getElementById('chat-messages').innerHTML = '';
    return;
  }

  if (consent) {
    consent.hidden = true;
  }
  if (form) {
    form.hidden = false;
  }

  if (history.length === 0) {
    startFreshConversation();
  }

  document.getElementById('chat-input')?.focus();
}

/**
 * סוגר את הפאנל ומאפס שיחה.
 */
function closePanel() {
  const panel = document.getElementById('chat-panel');
  const fab = document.getElementById('chat-fab');

  if (panel) {
    panel.hidden = true;
    panel.classList.remove('chat-panel--expanded');
  }

  if (fab) {
    fab.hidden = false;
  }

  history = [];
  allowSensitive = false;
  const list = document.getElementById('chat-messages');

  if (list) {
    list.innerHTML = '';
  }
}

/**
 * שולח הודעת משתמש ומקבל תשובה.
 * @param {string} text
 */
async function handleSend(text) {
  const trimmed = text.trim();
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const sensitiveBar = document.getElementById('chat-sensitive-bar');

  if (!trimmed) {
    return;
  }

  if (history.filter((m) => m.role === 'user').length >= CHAT_MAX_MESSAGES) {
    appendMessage(
      'assistant',
      'הגעתם למגבלת ההודעות בשיחה זו. סגרו את הצ׳אט (X) ופתחו מחדש כדי להתחיל שיחה חדשה.',
    );
    return;
  }

  appendMessage('user', trimmed);

  if (input) {
    input.value = '';
  }

  if (sendBtn) {
    sendBtn.disabled = true;
  }

  appendMessage('assistant', '', { isTyping: true });

  const result = await sendChatMessage({
    message: trimmed,
    allowSensitive,
    history: history.slice(0, -1),
  });

  removeTyping();
  appendMessage('assistant', result.reply || 'לא הצלחתי לענות כרגע.');

  if (result.needsSensitiveConsent && sensitiveBar) {
    sensitiveBar.hidden = false;
  }

  if (result.action && !result.needsSensitiveConsent) {
    runChatAction(result.action, { message: trimmed });
  }

  if (sendBtn) {
    sendBtn.disabled = false;
  }

  input?.focus();
}

/**
 * מחבר את כל אירועי הצ׳אט אחרי שהווידג׳ט במסמך.
 */
export function bindChatWidget() {
  const fab = document.getElementById('chat-fab');
  const closeBtn = document.getElementById('chat-close');
  const enlargeBtn = document.getElementById('chat-enlarge');
  const panel = document.getElementById('chat-panel');
  const form = document.getElementById('chat-form');
  const consentAccept = document.getElementById('chat-consent-accept');
  const sensitiveYes = document.getElementById('chat-sensitive-yes');
  const sensitiveNo = document.getElementById('chat-sensitive-no');
  const input = document.getElementById('chat-input');

  if (!fab || !panel || !form) {
    return;
  }

  fab.addEventListener('click', () => {
    openPanel();
  });

  closeBtn?.addEventListener('click', () => {
    closePanel();
  });

  enlargeBtn?.addEventListener('click', () => {
    const expanded = panel.classList.toggle('chat-panel--expanded');
    enlargeBtn.setAttribute('aria-label', expanded ? 'הקטן חלון' : 'הגדל חלון');
  });

  consentAccept?.addEventListener('click', () => {
    setAiChatConsent();
    document.getElementById('chat-consent').hidden = true;
    form.hidden = false;
    startFreshConversation();
    input?.focus();
  });

  sensitiveYes?.addEventListener('click', () => {
    allowSensitive = true;
    document.getElementById('chat-sensitive-bar').hidden = true;
    appendMessage(
      'assistant',
      'אושר. אפשר לשאול שוב על יתרה או כרטיס.',
    );
  });

  sensitiveNo?.addEventListener('click', () => {
    document.getElementById('chat-sensitive-bar').hidden = true;
    appendMessage('assistant', 'בסדר, ממשיכים בלי פרטים רגישים.');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSend(input?.value || '');
  });

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend(input.value);
    }
  });
}

/**
 * מזריק את הווידג׳ט לדף ומחבר אירועים.
 * לא מוצג בדף התחברות — רק באזור המחובר.
 */
export function mountChatWidget() {
  if (document.getElementById('chat-root')) {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', getChatWidgetMarkup());
  bindChatWidget();
}
