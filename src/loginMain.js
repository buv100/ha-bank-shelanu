/**
 * נקודת כניסה לדף ההתחברות בלבד (login.html).
 */

import './styles/main.css';
import './styles/legal.css';
import { getLoginMarkup, bindLoginEvents } from './pages/login.js';
import { initTheme } from './utils/theme.js';

/**
 * מאתחל רק את מסך ההתחברות.
 */
function initLoginPage() {
  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getLoginMarkup();
  bindLoginEvents();
}

initLoginPage();
