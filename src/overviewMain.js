/**
 * נקודת כניסה לדף ריכוז יתרות (overview.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/overview.css';
import './styles/legal.css';
import './styles/chat.css';
import {
  getOverviewMarkup,
  bindOverviewLiveUpdates,
} from './pages/overview.js';
import { mountChatWidget } from './ui/chatWidget.js';
import { bindSettingsMenu } from './ui/settingsMenu.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

/**
 * מאתחל את דף ריכוז היתרות.
 */
async function initOverviewPage() {
  if (!(await requireAuth())) {
    return;
  }

  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getOverviewMarkup();
  bindOverviewLiveUpdates();
  bindThemeToggle();
  bindSettingsMenu();
  mountChatWidget();
}

initOverviewPage();
