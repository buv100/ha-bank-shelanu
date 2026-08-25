/**
 * פרוקסי מקומי ל־Groq —
 * רץ בשרת Vite בלבד; המפתח לא נחשף לדפדפן.
 */

import {
  BANK_SYSTEM_PROMPT as CHAT_SYSTEM_PROMPT,
  buildGroqMessages,
  DEFAULT_GROQ_MODEL,
  GROQ_URL,
  INVEST_SYSTEM_PROMPT as INVEST_CHAT_SYSTEM_PROMPT,
  WANTS_LIST_PATTERN,
} from '../shared/groqPrompts.js';

export { CHAT_SYSTEM_PROMPT, INVEST_CHAT_SYSTEM_PROMPT };

/**
 * קורא את גוף הבקשה ממידלוור של Connect.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', reject);
  });
}

/**
 * בונה בלוק עובדות מטקסט מוכן או מאובייקט ישן.
 * @param {{ accountFactsText?: string, accountFacts?: object | null, allowSensitive: boolean }} input
 * @returns {string}
 */
function buildFactsBlock(input) {
  const text = String(input.accountFactsText || '').trim();

  if (text) {
    return text.slice(0, 14000);
  }

  if (!input.allowSensitive || !input.accountFacts) {
    return 'אין עובדות חשבון בבקשה — אל תמציא מספרים.';
  }

  return 'יש accountFacts אבל בלי טקסט מפורמט — אל תמציא מספרים חסרים.';
}

/**
 * שולח בקשה ל־Groq ומחזיר טקסט תשובה.
 * @param {{
 *   apiKey: string,
 *   model: string,
 *   message: string,
 *   allowSensitive: boolean,
 *   history: Array<{ role: string, content: string }>,
 *   accountFacts?: object | null,
 *   accountFactsText?: string,
 *   systemPrompt?: string,
 *   modeNote?: string,
 *   maxTokens?: number,
 *   investFactsText?: string
 * }} input
 * @returns {Promise<string>}
 */
export async function askGroq(input) {
  const modeNote =
    input.modeNote ||
    (input.allowSensitive
      ? 'המשתמש במצב רגיש — מותר לענות על החשבון לפי צילום העובדות בלבד.'
      : 'המשתמש במצב רגיל (בלי לחשוף יתרה/פרטי כרטיס מלאים).');

  const factsBlock = input.investFactsText
    ? String(input.investFactsText).trim().slice(0, 14000) ||
      'אין עובדות תיק — אל תמציא מספרים.'
    : buildFactsBlock(input);

  const wantsList = WANTS_LIST_PATTERN.test(String(input.message || ''));
  const maxTokens =
    input.maxTokens ||
    (input.allowSensitive && wantsList ? 700 : input.allowSensitive ? 350 : wantsList ? 420 : 220);

  const messages = buildGroqMessages({
    systemPrompt: input.systemPrompt || CHAT_SYSTEM_PROMPT,
    history: input.history,
    modeNote,
    factsBlock,
    message: input.message,
  });

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages,
      temperature: 0.35,
      max_tokens: maxTokens,
      reasoning_effort: 'low',
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq ${response.status}: ${detail.slice(0, 400)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text || typeof text !== 'string') {
    throw new Error('Groq returned empty content');
  }

  return text.trim();
}

/**
 * יוצר middleware ל־/api/chat.
 * @param {{ apiKey?: string, model?: string }} options
 * @returns {(req: import('http').IncomingMessage, res: import('http').ServerResponse) => void}
 */
export function createGroqChatMiddleware(options) {
  const apiKey = String(options.apiKey || '').trim();
  const model = String(options.model || DEFAULT_GROQ_MODEL).trim() || DEFAULT_GROQ_MODEL;

  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'method not allowed' }));
      return;
    }

    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'missing GROQ_API_KEY in .env' }));
      return;
    }

    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw || '{}');
      const reply = await askGroq({
        apiKey,
        model,
        message: String(body.message || ''),
        allowSensitive: Boolean(body.allowSensitive),
        history: Array.isArray(body.history) ? body.history : [],
        accountFacts: body.accountFacts && typeof body.accountFacts === 'object'
          ? body.accountFacts
          : null,
        accountFactsText: String(body.accountFactsText || ''),
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ reply, action: null, needsSensitiveConsent: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'groq failed';
      console.error('[groq-chat]', message);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'groq failed', detail: message.slice(0, 300) }));
    }
  };
}

/**
 * יוצר middleware ל־/api/invest-chat (יועץ השקעות בדמו).
 * @param {{ apiKey?: string, model?: string }} options
 * @returns {(req: import('http').IncomingMessage, res: import('http').ServerResponse) => void}
 */
export function createInvestChatMiddleware(options) {
  const apiKey = String(options.apiKey || '').trim();
  const model = String(options.model || DEFAULT_GROQ_MODEL).trim() || DEFAULT_GROQ_MODEL;

  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'method not allowed' }));
      return;
    }

    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'missing GROQ_API_KEY in .env' }));
      return;
    }

    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw || '{}');
      const reply = await askGroq({
        apiKey,
        model,
        message: String(body.message || ''),
        allowSensitive: true,
        history: Array.isArray(body.history) ? body.history : [],
        investFactsText: String(body.investFactsText || ''),
        systemPrompt: INVEST_CHAT_SYSTEM_PROMPT,
        modeNote:
          'המשתמש באזור המסחר — ענה כיועץ השקעות לפי צילום התיק/השוק בלבד. הזכר שזה דמו.',
        maxTokens: 420,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ reply }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'groq failed';
      console.error('[invest-chat]', message);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'groq failed', detail: message.slice(0, 300) }));
    }
  };
}
