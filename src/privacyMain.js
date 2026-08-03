/**
 * נקודת כניסה למדיניות פרטיות.
 */

import './styles/main.css';
import './styles/legal.css';
import { getPrivacyMarkup } from './pages/privacy.js';
import { initTheme } from './utils/theme.js';

initTheme();
const app = document.getElementById('app');

if (app) {
  app.innerHTML = getPrivacyMarkup();
}
