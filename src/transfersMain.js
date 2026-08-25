/**
 * נקודת כניסה לדף העברות (transfers.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/legal.css';
import './styles/chat.css';
import './styles/transfers.css';
import { bindTransfersEvents, getTransfersMarkup } from './pages/transfers.js';
import { mountChatWidget } from './ui/chatWidget.js';
import { bindSettingsMenu } from './ui/settingsMenu.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

async function initTransfersPage() {
  if (!(await requireAuth())) {
    return;
  }

  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getTransfersMarkup();
  bindTransfersEvents();
  bindThemeToggle();
  bindSettingsMenu();
  mountChatWidget();
}

initTransfersPage();
