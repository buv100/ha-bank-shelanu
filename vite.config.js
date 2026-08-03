/**
 * הגדרות Vite לפרויקט "הבנק שלנו".
 * קובץ זה אומר לכלי הבנייה איך להריץ את האתר המקומי.
 */
import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ב־ES modules אין __dirname מובנה — בונים אותו מכאן
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // תיקיית השורש של האתר (איפה נמצא index.html)
  root: '.',
  // ב־GitHub Actions מפרסמים תחת /ha-bank-shelanu/ ; מקומית נשאר /
  base: process.env.GITHUB_ACTIONS ? '/ha-bank-shelanu/' : '/',
  server: {
    // מאזינים על IPv4 כדי ש־http://127.0.0.1:5173 יעבוד בוודאות ב־Windows
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: false,
  },
  // דפי HTML: התחברות + אזור מחובר + הלוואה + הצהרות
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        account: resolve(__dirname, 'account.html'),
        cards: resolve(__dirname, 'cards.html'),
        profile: resolve(__dirname, 'profile.html'),
        loan: resolve(__dirname, 'loan.html'),
        accessibility: resolve(__dirname, 'accessibility.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
      },
    },
  },
});
