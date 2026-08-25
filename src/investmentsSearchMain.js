/**
 * נקודת כניסה לדף חיפוש לקנייה.
 */

import './styles/investments.css';
import {
  bindInvestmentsSearchActions,
  getInvestmentsSearchMarkup,
} from './pages/investmentsSearch.js';
import { mountInvestChatWidget } from './ui/investChatWidget.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

async function initInvestmentsSearchPage() {
  if (!(await requireAuth())) {
    return;
  }

  initTheme();
  document.body.classList.add('mx-body');

  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getInvestmentsSearchMarkup();
  bindThemeToggle();
  bindInvestmentsSearchActions();
  mountInvestChatWidget();
}

initInvestmentsSearchPage();
