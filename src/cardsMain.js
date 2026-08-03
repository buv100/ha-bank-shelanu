/**
 * נקודת כניסה לדף הכרטיסים (cards.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/cards.css';
import './styles/legal.css';
import './styles/chat.css';
import { getCardsMarkup } from './pages/cards.js';
import { bindCardPicker, selectCard } from './ui/cardPicker.js';
import { bindCardReveal, consumeRevealQueryParam } from './ui/cardReveal.js';
import { mountChatWidget } from './ui/chatWidget.js';
import { bindSettingsMenu } from './ui/settingsMenu.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { initTheme } from './utils/theme.js';

/**
 * מאתחל את דף הכרטיסים (בחירה + תצוגה + הצגה מלאה).
 */
function initCardsPage() {
  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getCardsMarkup();
  bindThemeToggle();
  bindSettingsMenu();
  bindCardPicker();
  bindCardReveal();
  mountChatWidget();

  const params = new URLSearchParams(window.location.search);
  const revealId = params.get('reveal');

  if (revealId) {
    selectCard(revealId);
  }

  consumeRevealQueryParam();
}

initCardsPage();
