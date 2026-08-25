/**
 * ווידג׳ט צ׳אט — FAB מרחף + פאנל קטן שניתן להרחבה.
 * השיחה נשמרת בסגירה; מחיקה רק בכפתור ייעודי.
 */

import { PRIVACY_PAGE } from './navigation.js';
import { runChatAction } from '../services/chatActions.js';
import { sendChatMessage } from '../services/chatApi.js';
import {
  CHAT_MAX_MESSAGE_LENGTH,
  CHAT_MAX_MESSAGES,
  clearChatSession,
  hasAiChatConsent,
  loadChatSession,
  saveChatSession,
  setAiChatConsent,
} from '../utils/chatPrefs.js';
import { getCurrentCards, getCurrentProfile } from '../utils/session.js';

/** @typedef {'regular' | 'sensitive'} ChatMode */

/** מצב השיחה הנוכחית — null עד שבוחרים */
/** @type {ChatMode | null} */
let chatMode = null;

/** האם במעבר ממצב רגיל לרגיש (דורש אישור) */
let upgradingFromRegular = false;

/** אחרי מעבר למצב רגיש — להמשיך לבחירת/הצגת כרטיס */
let pendingCardReveal = false;

/** הודעה אחרונה שדרשה מצב רגיש — לחידוש אחרי מעבר */
/** @type {string | null} */
let pendingSensitiveMessage = null;

/** היסטוריית הודעות לשיחה הפתוחה */
/** @type {Array<{ role: 'user' | 'assistant', content: string }>} */
let history = [];

/**
 * שומר מצב שיחה נוכחי בסשן.
 */
function persistChatSession() {
  saveChatSession({ mode: chatMode, history });
}

/**
 * האם המצב הנוכחי מאפשר פרטים רגישים.
 * @returns {boolean}
 */
function allowSensitive() {
  return chatMode === 'sensitive';
}

/**
 * שם הבוט לפי המשתמש המחובר בדמו.
 * @returns {string}
 */
function getBotName() {
  const profile = getCurrentProfile();
  return profile ? `הבנקאי של ${profile.fullName}` : 'הבנקאי';
}

/**
 * מעדכן את תווית המצב בכותרת הצ׳אט.
 */
function updateModeDisclaimer() {
  const el = document.getElementById('chat-panel-disclaimer');

  if (!el) {
    return;
  }

  if (chatMode === 'sensitive') {
    el.textContent = 'מצב רגיש · AI · דמו';
  } else if (chatMode === 'regular') {
    el.textContent = 'מצב רגיל · AI · דמו';
  } else {
    el.textContent = 'AI · דמו · לא ייעוץ פיננסי';
  }
}

/**
 * מעדכן זמינות כפתור המחיקה.
 */
function updateClearButton() {
  const clearBtn = document.getElementById('chat-clear');

  if (!(clearBtn instanceof HTMLButtonElement)) {
    return;
  }

  const canClear = Boolean(chatMode) && history.length > 0;
  clearBtn.hidden = !canClear;
  clearBtn.disabled = !canClear;
}

/**
 * פותח את דף/מודל פרטי הכרטיס — בלי לשלוח פרטים רגישים לצ׳אט.
 * @param {string} cardId
 */
function openSelectedCardDetails(cardId) {
  const card = getCurrentCards().find((item) => item.id === cardId);

  if (!card) {
    appendMessage('assistant', 'לא מצאתי את הכרטיס שנבחר.');
    return;
  }

  appendMessage('assistant', `פותח את פרטי ${card.productName}…`);
  runChatAction('show_card_details', { cardId });
}

/**
 * מציג כפתורי בחירה בין כרטיסים בתוך הצ׳אט.
 * @param {Array<{ id: string, label: string, lastFour: string }>} choices
 */
function appendCardChoices(choices) {
  const list = document.getElementById('chat-messages');

  if (!list || !choices?.length) {
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'chat-card-choices';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', 'בחירת כרטיס');

  choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-card-choice';
    btn.dataset.chatCardId = choice.id;
    btn.innerHTML = `
      <span class="chat-card-choice__name">${choice.label}</span>
      <span class="chat-card-choice__digits">•••• ${choice.lastFour}</span>
    `;
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.chat-card-choice').forEach((el) => {
        el.disabled = true;
        el.classList.toggle('is-selected', el === btn);
      });
      openSelectedCardDetails(choice.id);
    });
    wrap.appendChild(btn);
  });

  list.appendChild(wrap);
  list.scrollTop = list.scrollHeight;
}

/**
 * מציע בחירת כרטיס (אחרי מעבר למצב רגיש או ישירות).
 */
function offerCardPicker() {
  const cards = getCurrentCards();

  if (cards.length === 0) {
    appendMessage('assistant', 'אין כרטיסים למשתמש זה.');
    return;
  }

  if (cards.length === 1) {
    openSelectedCardDetails(cards[0].id);
    return;
  }

  appendMessage('assistant', 'באיזה כרטיס תרצה/י לראות פרטים? לחץ/י לבחירה:');
  appendCardChoices(
    cards.map((card) => ({
      id: card.id,
      label: card.productName,
      lastFour: card.lastFour,
    })),
  );
}

/**
 * מציג/מסתיר אלמנטי שער לפני תחילת השיחה.
 * @param {'ai' | 'mode' | 'sensitive-consent' | 'chat'} mode
 */
function setChatGate(mode) {
  const aiConsent = document.getElementById('chat-consent');
  const modeGate = document.getElementById('chat-mode-gate');
  const sensitiveConsent = document.getElementById('chat-sensitive-consent');
  const form = document.getElementById('chat-form');
  const messages = document.getElementById('chat-messages');
  const upgradeBar = document.getElementById('chat-upgrade-bar');

  if (aiConsent) {
    aiConsent.hidden = mode !== 'ai';
  }

  if (modeGate) {
    modeGate.hidden = mode !== 'mode';
  }

  if (sensitiveConsent) {
    sensitiveConsent.hidden = mode !== 'sensitive-consent';
  }

  if (form) {
    form.hidden = mode !== 'chat';
  }

  if (messages) {
    messages.hidden = mode !== 'chat';
  }

  if (upgradeBar) {
    upgradeBar.hidden = true;
  }

  updateClearButton();
}

/**
 * בוחר מצב צ׳אט — רגיל מיד, רגיש רק אחרי אישור.
 * @param {ChatMode} mode
 */
function selectChatMode(mode) {
  if (mode === 'regular') {
    chatMode = 'regular';
    upgradingFromRegular = false;
    updateModeDisclaimer();
    startFreshConversation();
    document.getElementById('chat-input')?.focus();
    return;
  }

  upgradingFromRegular = false;
  setChatGate('sensitive-consent');
}

/**
 * מאשר כניסה למצב רגיש (פעם אחת בכניסה / במעבר).
 */
async function acceptSensitiveConsent() {
  if (upgradingFromRegular) {
    upgradingFromRegular = false;
    setChatGate('chat');
    await upgradeToSensitiveMode();
    document.getElementById('chat-input')?.focus();
    return;
  }

  chatMode = 'sensitive';
  updateModeDisclaimer();
  startFreshConversation();
  document.getElementById('chat-input')?.focus();
}

/**
 * מבטל את מסך אישור המצב הרגיש.
 */
function cancelSensitiveConsent() {
  if (upgradingFromRegular) {
    upgradingFromRegular = false;
    pendingCardReveal = false;
    pendingSensitiveMessage = null;
    setChatGate('chat');
    appendMessage('assistant', 'בסדר, ממשיכים במצב רגיל.');
    document.getElementById('chat-input')?.focus();
    return;
  }

  setChatGate('mode');
}

/**
 * מעביר ממצב רגיל למצב רגיש (באמצע שיחה).
 */
async function upgradeToSensitiveMode() {
  chatMode = 'sensitive';
  updateModeDisclaimer();
  persistChatSession();

  const upgradeBar = document.getElementById('chat-upgrade-bar');
  const input = document.getElementById('chat-input');

  if (upgradeBar) {
    upgradeBar.hidden = true;
  }

  if (input) {
    input.placeholder = 'שאלו על יתרה, כרטיסים או מעבר לדף…';
  }

  appendMessage('assistant', 'עברתם למצב רגיש.');

  if (pendingCardReveal) {
    pendingCardReveal = false;
    pendingSensitiveMessage = null;
    offerCardPicker();
    return;
  }

  if (pendingSensitiveMessage) {
    const message = pendingSensitiveMessage;
    pendingSensitiveMessage = null;
    await resumeSensitiveRequest(message);
    return;
  }
}

/**
 * מריץ מחדש בקשה רגישה אחרי מעבר מצב (בלי להוסיף שוב הודעת משתמש).
 * @param {string} message
 */
async function resumeSensitiveRequest(message) {
  const sendBtn = document.getElementById('chat-send');

  if (sendBtn) {
    sendBtn.disabled = true;
  }

  appendMessage('assistant', '', { isTyping: true });

  const result = await sendChatMessage({
    message,
    allowSensitive: true,
    history,
  });

  removeTyping();
  appendMessage('assistant', result.reply || 'לא הצלחתי לענות כרגע.');

  if (result.cardChoices?.length) {
    appendCardChoices(result.cardChoices);
  } else if (result.action === 'show_card_details' && result.cardId) {
    runChatAction('show_card_details', { cardId: result.cardId });
  } else if (result.action && result.action !== 'choose_card') {
    runChatAction(result.action, {
      message,
      cardId: result.cardId,
    });
  }

  if (sendBtn) {
    sendBtn.disabled = false;
  }

  document.getElementById('chat-input')?.focus();
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
            <p id="chat-panel-disclaimer" class="chat-panel__disclaimer">AI · דמו · לא ייעוץ פיננסי</p>
          </div>
          <div class="chat-panel__tools">
            <button id="chat-clear" class="chat-tool" type="button" aria-label="מחק שיחה" title="מחק שיחה" hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12"/>
              </svg>
            </button>
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

        <div id="chat-mode-gate" class="chat-mode-gate" hidden>
          <p class="chat-mode-gate__title">בחרו סוג צ׳אט</p>
          <p class="chat-mode-gate__text">השיחה נשמרת בסגירה. למחיקה — כפתור הפח בכותרת.</p>
          <div class="chat-mode-gate__options">
            <button id="chat-mode-regular" class="chat-mode-option" type="button">
              <span class="chat-mode-option__label">צ׳אט רגיל</span>
              <span class="chat-mode-option__desc">שאלות פשוטות ומעבר בין דפים — בלי יתרה או פרטי כרטיס</span>
            </button>
            <button id="chat-mode-sensitive" class="chat-mode-option chat-mode-option--sensitive" type="button">
              <span class="chat-mode-option__label">צ׳אט רגיש</span>
              <span class="chat-mode-option__desc">גישה מלאה — יתרה, פרטי כרטיס וכל הפעולות</span>
            </button>
          </div>
        </div>

        <div id="chat-sensitive-consent" class="chat-consent chat-consent--sensitive" hidden>
          <p class="chat-consent__text">
            מצב רגיש מאפשר גישה ליתרה, מספר כרטיס מלא ו־CVV בשיחה זו.
            יש לאשר פעם אחת לפני הכניסה. אפשר לבטל בכל רגע ע״י סגירת הצ׳אט.
          </p>
          <button id="chat-sensitive-consent-accept" class="chat-consent__btn" type="button">מאשר/ת כניסה למצב רגיש</button>
          <button id="chat-sensitive-consent-back" class="chat-consent__btn chat-consent__btn--secondary" type="button">חזרה</button>
        </div>

        <div id="chat-messages" class="chat-messages" aria-live="polite" hidden></div>

        <div id="chat-upgrade-bar" class="chat-sensitive" hidden>
          <p class="chat-sensitive__text">הבקשה דורשת מצב רגיש. להעביר עכשיו?</p>
          <div class="chat-sensitive__actions">
            <button id="chat-upgrade-yes" class="chat-sensitive__btn chat-sensitive__btn--yes" type="button">עבור למצב רגיש</button>
            <button id="chat-upgrade-no" class="chat-sensitive__btn" type="button">הישאר במצב רגיל</button>
          </div>
        </div>

        <form id="chat-form" class="chat-form" hidden>
          <label class="visually-hidden" for="chat-input">הודעה לצ׳אט</label>
          <textarea
            id="chat-input"
            class="chat-input"
            rows="1"
            maxlength="${CHAT_MAX_MESSAGE_LENGTH}"
            placeholder="שאלו שאלה או בקשו מעבר לדף…"
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
 * @param {{ isTyping?: boolean, persist?: boolean }} [options]
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

    if (options.persist !== false) {
      persistChatSession();
    }

    updateClearButton();
  }
}

/**
 * מצייר מחדש את ההודעות השמורות על המסך.
 */
function renderHistory() {
  const list = document.getElementById('chat-messages');

  if (!list) {
    return;
  }

  list.innerHTML = '';

  history.forEach((item) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble--${item.role}`;
    bubble.textContent = item.content;
    list.appendChild(bubble);
  });

  list.scrollTop = list.scrollHeight;
  updateClearButton();
}

/**
 * מסיר אינדיקטור כתיבה.
 */
function removeTyping() {
  document.getElementById('chat-typing')?.remove();
}

/**
 * מכין את שדה הקלט לפי מצב השיחה.
 */
function applyModeToInput() {
  const input = document.getElementById('chat-input');

  if (!input) {
    return;
  }

  input.placeholder = allowSensitive()
    ? 'שאלו על יתרה, כרטיסים או מעבר לדף…'
    : 'שאלו שאלה או בקשו מעבר לדף…';
}

/**
 * מאתחל שיחה חדשה עם ברכה (אחרי בחירת מצב).
 */
function startFreshConversation() {
  history = [];
  pendingCardReveal = false;
  pendingSensitiveMessage = null;
  const list = document.getElementById('chat-messages');
  const upgradeBar = document.getElementById('chat-upgrade-bar');

  if (list) {
    list.innerHTML = '';
  }

  if (upgradeBar) {
    upgradeBar.hidden = true;
  }

  setChatGate('chat');
  updateModeDisclaimer();
  applyModeToInput();

  const firstName = getCurrentProfile()?.fullName?.split(' ')[0] || 'שם';
  const modeHint = allowSensitive()
    ? 'אתם במצב רגיש — אפשר גם יתרה ופרטי כרטיס.'
    : 'אתם במצב רגיל — שאלות פשוטות ומעבר בין דפים.';

  appendMessage('assistant', `שלום ${firstName}, אשמח לעזור. ${modeHint}`);
}

/**
 * ממשיך שיחה קיימת אחרי פתיחה מחדש.
 */
function resumeConversation() {
  pendingCardReveal = false;
  pendingSensitiveMessage = null;
  upgradingFromRegular = false;

  setChatGate('chat');
  updateModeDisclaimer();
  applyModeToInput();
  renderHistory();
}

/**
 * מוחק את השיחה וחוזר לבחירת מצב.
 */
function clearConversation() {
  if (history.length === 0 && !chatMode) {
    return;
  }

  const confirmed = window.confirm('למחוק את כל השיחה? לא ניתן לשחזר.');

  if (!confirmed) {
    return;
  }

  history = [];
  chatMode = null;
  upgradingFromRegular = false;
  pendingCardReveal = false;
  pendingSensitiveMessage = null;
  clearChatSession();
  updateModeDisclaimer();

  const list = document.getElementById('chat-messages');

  if (list) {
    list.innerHTML = '';
  }

  setChatGate('mode');
}

/**
 * פותח את הפאנל (אחרי בדיקת הסכמות ובחירת מצב).
 */
function openPanel() {
  const panel = document.getElementById('chat-panel');
  const fab = document.getElementById('chat-fab');

  if (!panel || !fab) {
    return;
  }

  panel.hidden = false;
  fab.hidden = true;
  panel.classList.remove('chat-panel--expanded');

  if (!hasAiChatConsent()) {
    setChatGate('ai');
    return;
  }

  if (!chatMode) {
    setChatGate('mode');
    return;
  }

  if (history.length === 0) {
    startFreshConversation();
  } else {
    resumeConversation();
  }

  document.getElementById('chat-input')?.focus();
}

/**
 * סוגר את הפאנל — השיחה נשמרת.
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

  upgradingFromRegular = false;
  pendingCardReveal = false;
  pendingSensitiveMessage = null;
  persistChatSession();
}

/**
 * שולח הודעת משתמש ומקבל תשובה.
 * @param {string} text
 */
async function handleSend(text) {
  const trimmed = text.trim();
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const upgradeBar = document.getElementById('chat-upgrade-bar');

  if (!trimmed) {
    return;
  }

  if (history.filter((m) => m.role === 'user').length >= CHAT_MAX_MESSAGES) {
    appendMessage(
      'assistant',
      'הגעתם למגבלת ההודעות בשיחה זו. מחקו את השיחה (פח) כדי להתחיל מחדש.',
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
    allowSensitive: allowSensitive(),
    history: history.slice(0, -1),
  });

  removeTyping();
  appendMessage('assistant', result.reply || 'לא הצלחתי לענות כרגע.');

  if (result.needsSensitiveConsent && upgradeBar && !allowSensitive()) {
    pendingSensitiveMessage = trimmed;
    pendingCardReveal = Boolean(result.pendingCardReveal) ||
      result.action === 'choose_card' ||
      result.action === 'show_card_details' ||
      /כרטיס|card|cvv|reveal/i.test(trimmed);
    upgradeBar.hidden = false;
  }

  if (result.cardChoices?.length) {
    appendCardChoices(result.cardChoices);
  } else if (result.action === 'show_card_details' && result.cardId && allowSensitive()) {
    runChatAction('show_card_details', { cardId: result.cardId });
  } else if (result.action && result.action !== 'choose_card' && !result.needsSensitiveConsent) {
    runChatAction(result.action, {
      message: trimmed,
      cardId: result.cardId,
    });
  }

  if (sendBtn) {
    sendBtn.disabled = false;
  }

  input?.focus();
}

/**
 * טוען שיחה שמורה מהסשן (גם אחרי מעבר דף).
 */
function restoreSessionFromStorage() {
  const saved = loadChatSession();
  chatMode = saved.mode;
  history = saved.history;
  updateModeDisclaimer();
  updateClearButton();
}

/**
 * מחבר את כל אירועי הצ׳אט אחרי שהווידג׳ט במסמך.
 */
export function bindChatWidget() {
  const fab = document.getElementById('chat-fab');
  const closeBtn = document.getElementById('chat-close');
  const clearBtn = document.getElementById('chat-clear');
  const enlargeBtn = document.getElementById('chat-enlarge');
  const panel = document.getElementById('chat-panel');
  const form = document.getElementById('chat-form');
  const consentAccept = document.getElementById('chat-consent-accept');
  const modeRegular = document.getElementById('chat-mode-regular');
  const modeSensitive = document.getElementById('chat-mode-sensitive');
  const sensitiveConsentAccept = document.getElementById('chat-sensitive-consent-accept');
  const sensitiveConsentBack = document.getElementById('chat-sensitive-consent-back');
  const upgradeYes = document.getElementById('chat-upgrade-yes');
  const upgradeNo = document.getElementById('chat-upgrade-no');
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

  clearBtn?.addEventListener('click', () => {
    clearConversation();
  });

  enlargeBtn?.addEventListener('click', () => {
    const expanded = panel.classList.toggle('chat-panel--expanded');
    enlargeBtn.setAttribute('aria-label', expanded ? 'הקטן חלון' : 'הגדל חלון');
  });

  consentAccept?.addEventListener('click', () => {
    setAiChatConsent();
    setChatGate(chatMode ? 'chat' : 'mode');

    if (chatMode && history.length > 0) {
      resumeConversation();
      input?.focus();
    }
  });

  modeRegular?.addEventListener('click', () => {
    selectChatMode('regular');
  });

  modeSensitive?.addEventListener('click', () => {
    selectChatMode('sensitive');
  });

  sensitiveConsentAccept?.addEventListener('click', () => {
    acceptSensitiveConsent();
  });

  sensitiveConsentBack?.addEventListener('click', () => {
    cancelSensitiveConsent();
  });

  upgradeYes?.addEventListener('click', () => {
    upgradingFromRegular = true;
    document.getElementById('chat-upgrade-bar').hidden = true;
    setChatGate('sensitive-consent');
  });

  upgradeNo?.addEventListener('click', () => {
    pendingCardReveal = false;
    pendingSensitiveMessage = null;
    document.getElementById('chat-upgrade-bar').hidden = true;
    appendMessage('assistant', 'בסדר, ממשיכים במצב רגיל.');
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
  restoreSessionFromStorage();
  bindChatWidget();
}
