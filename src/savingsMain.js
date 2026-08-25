/**
 * נקודת כניסה לדף החסכונות (savings.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/legal.css';
import './styles/chat.css';
import './styles/savings.css';
import { bindSavingsEvents, getSavingsMarkup } from './pages/savings.js';
import { mountChatWidget } from './ui/chatWidget.js';
import { bindSettingsMenu } from './ui/settingsMenu.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

async function initSavingsPage() {
  if (!(await requireAuth())) {
    return;
  }

  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getSavingsMarkup();
  bindSavingsEvents();
  bindThemeToggle();
  bindSettingsMenu();
  mountChatWidget();
}

initSavingsPage();
