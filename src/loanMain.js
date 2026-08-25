/**
 * נקודת כניסה לדף בקשת הלוואה (loan.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/loan.css';
import './styles/legal.css';
import './styles/chat.css';
import { getLoanMarkup, bindLoanForm } from './pages/loan.js';
import { mountChatWidget } from './ui/chatWidget.js';
import { bindSettingsMenu } from './ui/settingsMenu.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

/**
 * מאתחל את דף ההלוואה והטופס.
 */
async function initLoanPage() {
  if (!(await requireAuth())) {
    return;
  }

  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getLoanMarkup();
  bindLoanForm();
  bindThemeToggle();
  bindSettingsMenu();
  mountChatWidget();
}

initLoanPage();
