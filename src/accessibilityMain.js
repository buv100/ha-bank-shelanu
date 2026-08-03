/**
 * נקודת כניסה להצהרת נגישות.
 */

import './styles/main.css';
import './styles/legal.css';
import { getAccessibilityMarkup } from './pages/accessibility.js';
import { initTheme } from './utils/theme.js';

initTheme();
const app = document.getElementById('app');

if (app) {
  app.innerHTML = getAccessibilityMarkup();
}
