/**
 * נקודת כניסה לדף הנחיתה בלבד (index.html).
 */

import './styles/main.css';
import './styles/landing.css';
import { getLandingMarkup } from './pages/landing.js';
import { initTheme } from './utils/theme.js';

/**
 * מאתחל את דף הנחיתה.
 */
function initLandingPage() {
  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getLandingMarkup();
}

initLandingPage();
