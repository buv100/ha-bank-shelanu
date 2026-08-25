/**
 * נקודת כניסה לדף מסחר ראשי.
 */

import './styles/investments.css';
import {
  bindInvestmentsActions,
  getInvestmentsMarkup,
  showPendingBuyFlash,
} from './pages/investments.js';
import { mountInvestChatWidget } from './ui/investChatWidget.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

async function initInvestmentsPage() {
  if (!(await requireAuth())) {
    return;
  }

  initTheme();
  document.body.classList.add('mx-body');

  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getInvestmentsMarkup();
  bindThemeToggle();
  bindInvestmentsActions();
  showPendingBuyFlash();
  mountInvestChatWidget();
}

initInvestmentsPage();
