/**
 * צ׳אט יועץ השקעות — נפרד מצ׳אט הבנק, רק באזור המסחר.
 */

import { sendInvestChatMessage } from '../services/investChatApi.js';
import { getCurrentProfile } from '../utils/session.js';

const SESSION_KEY = 'ha-invest-chat-session';
const CONSENT_KEY = 'ha-invest-chat-consent';
const MAX_LEN = 400;
const MAX_USER_MESSAGES = 40;

/** @type {Array<{ role: 'user' | 'assistant', content: string }>} */
let history = [];
let started = false;

/**
 * @returns {boolean}
 */
function hasConsent() {
  return window.sessionStorage.getItem(CONSENT_KEY) === '1';
}

function setConsent() {
  window.sessionStorage.setItem(CONSENT_KEY, '1');
}

function persist() {
  window.sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ started, history }),
  );
}

function loadSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    started = Boolean(parsed.started);
    history = Array.isArray(parsed.history)
      ? parsed.history.filter(
          (item) =>
            item &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string',
        )
      : [];
  } catch {
    history = [];
    started = false;
  }
}

/**
 * @returns {string}
 */
function getAdvisorName() {
  const profile = getCurrentProfile();
  return profile ? `היועץ של ${profile.fullName}` : 'יועץ השקעות';
}

/**
 * כפתור יועץ ליד מתג מצב בהיר/כהה בכותרת.
 * @returns {string}
 */
export function getInvestChatToggleMarkup() {
  return `
    <button
      type="button"
      class="ix-chat-toggle"
      id="ix-chat-fab"
      aria-expanded="false"
      aria-controls="ix-chat-panel"
      title="יועץ השקעות"
      aria-label="יועץ השקעות"
    >
      יועץ
    </button>
  `;
}

/**
 * @returns {string}
 */
function getPanelMarkup() {
  return `
    <div class="ix-chat" id="ix-chat-root">
      <section class="ix-chat-panel" id="ix-chat-panel" hidden aria-label="צ׳אט יועץ השקעות">
        <header class="ix-chat-panel__head">
          <div>
            <p class="ix-chat-panel__title" id="ix-chat-title">${getAdvisorName()}</p>
            <p class="ix-chat-panel__sub">ייעוץ דמו · לא ייעוץ אמיתי</p>
          </div>
          <div class="ix-chat-panel__actions">
            <button type="button" class="ix-chat-icon-btn" id="ix-chat-clear" title="נקה שיחה" aria-label="נקה שיחה" hidden>🗑</button>
            <button type="button" class="ix-chat-icon-btn" id="ix-chat-close" aria-label="סגור">✕</button>
          </div>
        </header>

        <div class="ix-chat-messages" id="ix-chat-messages" aria-live="polite"></div>

        <div class="ix-chat-suggestions" id="ix-chat-suggestions">
          <button type="button" class="ix-chip" data-ix-prompt="מה ההמלצה היומית לקנייה?">המלצה יומית</button>
          <button type="button" class="ix-chip" data-ix-prompt="האם ההשקעות שלי טובות?">התיק שלי</button>
          <button type="button" class="ix-chip" data-ix-prompt="במה כדאי לגוון את התיק?">גיוון</button>
        </div>

        <form class="ix-chat-form" id="ix-chat-form">
          <textarea
            id="ix-chat-input"
            class="ix-chat-input"
            rows="1"
            maxlength="${MAX_LEN}"
            placeholder="שאלו על התיק, המלצה יומית, או במה להשקיע…"
          ></textarea>
          <button type="submit" class="ix-chat-send" id="ix-chat-send" aria-label="שלח">➤</button>
        </form>
      </section>

      <div class="ix-chat-consent" id="ix-chat-consent" hidden>
        <div class="ix-chat-consent__card" role="dialog" aria-labelledby="ix-consent-title">
          <h2 id="ix-consent-title">יועץ השקעות בדמו</h2>
          <p>זה כלי למידה בלבד — לא ייעוץ השקעות אמיתי ולא המלצה לקנייה בשוק.</p>
          <div class="ix-chat-consent__actions">
            <button type="button" class="mx-btn mx-btn--secondary" id="ix-consent-cancel">ביטול</button>
            <button type="button" class="mx-btn mx-btn--buy" id="ix-consent-ok">הבנתי, התחל</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {'user' | 'assistant'} role
 * @param {string} content
 * @param {{ typing?: boolean, persist?: boolean }} [options]
 */
function appendMessage(role, content, options = {}) {
  const list = document.getElementById('ix-chat-messages');

  if (!list) {
    return;
  }

  const bubble = document.createElement('div');
  bubble.className = `ix-bubble ix-bubble--${role}${options.typing ? ' ix-bubble--typing' : ''}`;

  if (options.typing) {
    bubble.id = 'ix-typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
  } else {
    bubble.textContent = content;
  }

  list.appendChild(bubble);
  list.scrollTop = list.scrollHeight;

  if (!options.typing) {
    history.push({ role, content });

    if (options.persist !== false) {
      persist();
    }

    updateClearBtn();
  }
}

function removeTyping() {
  document.getElementById('ix-typing')?.remove();
}

function renderHistory() {
  const list = document.getElementById('ix-chat-messages');

  if (!list) {
    return;
  }

  list.innerHTML = '';
  history.forEach((item) => {
    const bubble = document.createElement('div');
    bubble.className = `ix-bubble ix-bubble--${item.role}`;
    bubble.textContent = item.content;
    list.appendChild(bubble);
  });
  list.scrollTop = list.scrollHeight;
  updateClearBtn();
}

function updateClearBtn() {
  const btn = document.getElementById('ix-chat-clear');

  if (!(btn instanceof HTMLButtonElement)) {
    return;
  }

  const can = started && history.length > 0;
  btn.hidden = !can;
  btn.disabled = !can;
}

function openPanel() {
  const panel = document.getElementById('ix-chat-panel');
  const fab = document.getElementById('ix-chat-fab');

  if (panel) panel.hidden = false;
  fab?.setAttribute('aria-expanded', 'true');
}

function closePanel() {
  const panel = document.getElementById('ix-chat-panel');
  const fab = document.getElementById('ix-chat-fab');

  if (panel) panel.hidden = true;
  fab?.setAttribute('aria-expanded', 'false');
}

function beginChat() {
  started = true;
  persist();

  if (history.length === 0) {
    appendMessage(
      'assistant',
      `שלום, אני ${getAdvisorName()}. אפשר לשאול על התיק, לבקש המלצה יומית, או רעיונות לגיוון — לפי נתוני הדמו בלבד.`,
    );
  } else {
    renderHistory();
  }

  updateClearBtn();
  openPanel();
  document.getElementById('ix-chat-input')?.focus();
}

/**
 * @param {string} text
 */
async function handleSend(text) {
  const trimmed = text.trim();

  if (!trimmed || !started) {
    return;
  }

  if (history.filter((m) => m.role === 'user').length >= MAX_USER_MESSAGES) {
    appendMessage('assistant', 'הגעתם למגבלת הודעות בדמו. נקו את השיחה כדי להתחיל מחדש.');
    return;
  }

  const input = document.getElementById('ix-chat-input');
  const sendBtn = document.getElementById('ix-chat-send');

  appendMessage('user', trimmed.slice(0, MAX_LEN));

  if (input instanceof HTMLTextAreaElement) {
    input.value = '';
  }

  if (sendBtn instanceof HTMLButtonElement) {
    sendBtn.disabled = true;
  }

  appendMessage('assistant', '', { typing: true });

  const result = await sendInvestChatMessage({
    message: trimmed,
    history: history.slice(0, -1),
  });

  removeTyping();
  appendMessage('assistant', result.reply || 'לא הצלחתי לענות כרגע.');

  if (sendBtn instanceof HTMLButtonElement) {
    sendBtn.disabled = false;
  }

  input?.focus();
}

/**
 * מצמיד את ווידג׳ט יועץ ההשקעות לדף המסחר.
 */
export function mountInvestChatWidget() {
  if (document.getElementById('ix-chat-root')) {
    return;
  }

  loadSession();

  if (!document.getElementById('ix-chat-fab')) {
    const actions = document.querySelector('.mx-top__actions');

    if (actions) {
      actions.insertAdjacentHTML('afterbegin', getInvestChatToggleMarkup());
    }
  }

  document.body.insertAdjacentHTML('beforeend', getPanelMarkup());

  const title = document.getElementById('ix-chat-title');

  if (title) {
    title.textContent = getAdvisorName();
  }

  if (started && history.length > 0) {
    renderHistory();
  }

  updateClearBtn();

  document.getElementById('ix-chat-fab')?.addEventListener('click', () => {
    const panel = document.getElementById('ix-chat-panel');

    if (panel && !panel.hidden) {
      closePanel();
      return;
    }

    if (!hasConsent()) {
      const consent = document.getElementById('ix-chat-consent');

      if (consent) consent.hidden = false;
      return;
    }

    if (!started) {
      beginChat();
      return;
    }

    openPanel();
    renderHistory();
  });

  document.getElementById('ix-consent-ok')?.addEventListener('click', () => {
    setConsent();
    const consent = document.getElementById('ix-chat-consent');

    if (consent) consent.hidden = true;
    beginChat();
  });

  document.getElementById('ix-consent-cancel')?.addEventListener('click', () => {
    const consent = document.getElementById('ix-chat-consent');

    if (consent) consent.hidden = true;
  });

  document.getElementById('ix-chat-close')?.addEventListener('click', () => {
    closePanel();
  });

  document.getElementById('ix-chat-clear')?.addEventListener('click', () => {
    if (!window.confirm('לנקות את שיחת היועץ?')) {
      return;
    }

    history = [];
    started = false;
    persist();
    renderHistory();
    closePanel();
  });

  document.getElementById('ix-chat-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('ix-chat-input');

    if (input instanceof HTMLTextAreaElement) {
      handleSend(input.value);
    }
  });

  document.getElementById('ix-chat-suggestions')?.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const prompt = target.dataset.ixPrompt;

    if (!prompt) {
      return;
    }

    if (!hasConsent()) {
      const consent = document.getElementById('ix-chat-consent');

      if (consent) consent.hidden = false;
      return;
    }

    if (!started) {
      beginChat();
    } else {
      openPanel();
    }

    handleSend(prompt);
  });
}
