/**
 * נקודת כניסה לדף הכרטיסים (cards.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/cards.css';
import './styles/legal.css';
import { getCardsMarkup } from './pages/cards.js';
import { bindCardPicker } from './ui/cardPicker.js';
import { bindCardReveal } from './ui/cardReveal.js';
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
}

initCardsPage();
