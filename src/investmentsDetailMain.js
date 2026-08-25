/**
 * נקודת כניסה לדף פירוט השקעה.
 */

import './styles/investments.css';
import {
  bindInvestmentsDetailActions,
  getInvestmentsDetailMarkup,
} from './pages/investmentsDetail.js';
import { mountInvestChatWidget } from './ui/investChatWidget.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

async function initInvestmentsDetailPage() {
  if (!(await requireAuth())) {
    return;
  }

  initTheme();
  document.body.classList.add('mx-body');

  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getInvestmentsDetailMarkup();
  bindThemeToggle();
  bindInvestmentsDetailActions();
  mountInvestChatWidget();
}

initInvestmentsDetailPage();
