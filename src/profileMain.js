/**
 * נקודת כניסה לדף הפרופיל (profile.html).
 */

import './styles/main.css';
import './styles/shell.css';
import './styles/profile.css';
import './styles/legal.css';
import { getProfileMarkup } from './pages/profile.js';
import { bindProfilePage } from './ui/profilePage.js';
import { bindSettingsMenu } from './ui/settingsMenu.js';
import { bindThemeToggle } from './ui/themeToggle.js';
import { initTheme } from './utils/theme.js';

/**
 * מאתחל את דף הפרופיל (פרטים, העדפות ויציאה).
 */
function initProfilePage() {
  initTheme();
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  app.innerHTML = getProfileMarkup();
  bindThemeToggle();
  bindSettingsMenu();
  bindProfilePage();
}

initProfilePage();
