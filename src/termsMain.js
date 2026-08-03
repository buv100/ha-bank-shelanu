/**
 * נקודת כניסה לתנאי שימוש.
 */

import './styles/main.css';
import './styles/legal.css';
import { getTermsMarkup } from './pages/terms.js';
import { initTheme } from './utils/theme.js';

initTheme();
const app = document.getElementById('app');

if (app) {
  app.innerHTML = getTermsMarkup();
}
