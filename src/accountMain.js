/**
 * נקודת כניסה לדף העו״ש (account.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/legal.css';
import { getAccountMarkup, renderTransactions } from './pages/account.js';
import { bindSettingsMenu } from './ui/settingsMenu.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { initTheme } from './utils/theme.js';

/**
 * מאתחל את מסך העובר־ושב בתוך המעטפת.
 */
function initAccountPage() {
  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getAccountMarkup();
  renderTransactions();
  bindThemeToggle();
  bindSettingsMenu();
}

initAccountPage();
