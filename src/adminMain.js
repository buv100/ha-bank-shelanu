/**
 * נקודת כניסה לדף הניהול בלבד (admin.html).
 */

import './styles/main.css';
import './styles/admin.css';
import { getAdminMarkup, bindAdminEvents } from './pages/admin.js';
import { initTheme } from './utils/theme.js';

function initAdminPage() {
  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getAdminMarkup();
  bindAdminEvents();
}

initAdminPage();
