/**
 * נקודת כניסה לדף פתיחת חשבון (setup.html).
 */

import './styles/main.css';
import './styles/setup.css';
import './styles/legal.css';
import { bindSetupEvents, getSetupMarkup } from './pages/setup.js';
import { goToOverviewPage } from './ui/navigation.js';
import { isSetupComplete, requireAuth } from './utils/session.js';
import { initTheme } from './utils/theme.js';

async function initSetupPage() {
  if (!(await requireAuth({ allowIncompleteSetup: true }))) {
    return;
  }

  if (isSetupComplete()) {
    goToOverviewPage();
    return;
  }

  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getSetupMarkup();
  bindSetupEvents();
}

initSetupPage();
