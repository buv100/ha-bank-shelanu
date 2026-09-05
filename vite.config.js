/**
 * הגדרות Vite לפרויקט "הבנק שלנו".
 * קובץ זה אומר לכלי הבנייה איך להריץ את האתר המקומי.
 */
import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createGroqChatMiddleware, createInvestChatMiddleware } from './server/groqChat.js';
import { createAdminLoginMiddleware, createAdminCommandMiddleware } from './server/bankRiskAgent.js';
import { DEFAULT_GROQ_MODEL } from './shared/groqPrompts.js';

// ב־ES modules אין __dirname מובנה — בונים אותו מכאן
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // '' = כל המשתנים, כולל GROQ_API_KEY (לא רק VITE_)
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
    plugins: [
      {
        name: 'groq-chat-proxy',
        configureServer(server) {
          server.middlewares.use(
            '/api/chat',
            createGroqChatMiddleware({
              apiKey: env.GROQ_API_KEY,
              model: env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
            }),
          );
          server.middlewares.use(
            '/api/invest-chat',
            createInvestChatMiddleware({
              apiKey: env.GROQ_API_KEY,
              model: env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
            }),
          );
          // סוכן bank-risk-expert (admin.html) — מקומי בלבד, ראו server/bankRiskAgent.js
          server.middlewares.use(
            '/api/admin/login',
            createAdminLoginMiddleware({
              supabaseUrl: env.VITE_SUPABASE_URL,
              supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
              sessionSecret: env.ADMIN_SESSION_SECRET,
              dbUrl: env.SUPABASE_DB_URL,
            }),
          );
          server.middlewares.use(
            '/api/admin/command',
            createAdminCommandMiddleware({
              sessionSecret: env.ADMIN_SESSION_SECRET,
              dbUrl: env.SUPABASE_DB_URL,
              anthropicApiKey: env.ANTHROPIC_API_KEY,
              googleServiceAccountKeyPath: env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
            }),
          );
        },
      },
    ],
    // דפי HTML: התחברות + אזור מחובר + הלוואה + הצהרות
    build: {
      rollupOptions: {
        input: {
          landing: resolve(__dirname, 'index.html'),
          login: resolve(__dirname, 'login.html'),
          account: resolve(__dirname, 'account.html'),
          overview: resolve(__dirname, 'overview.html'),
          investments: resolve(__dirname, 'investments.html'),
          investmentsSearch: resolve(__dirname, 'investments-search.html'),
          investmentDetail: resolve(__dirname, 'investment-detail.html'),
          cards: resolve(__dirname, 'cards.html'),
          transfers: resolve(__dirname, 'transfers.html'),
          savings: resolve(__dirname, 'savings.html'),
          profile: resolve(__dirname, 'profile.html'),
          setup: resolve(__dirname, 'setup.html'),
          loan: resolve(__dirname, 'loan.html'),
          admin: resolve(__dirname, 'admin.html'),
          accessibility: resolve(__dirname, 'accessibility.html'),
          privacy: resolve(__dirname, 'privacy.html'),
          terms: resolve(__dirname, 'terms.html'),
        },
      },
    },
  };
});
