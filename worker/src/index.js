/**
 * Cloudflare Worker — Proxy בטוח ל־Groq.
 * המפתח נשאר בשרת בלבד (GROQ_API_KEY).
 *
 * פריסה (בקצרה):
 * 1. npm i -g wrangler
 * 2. cd worker && wrangler login
 * 3. wrangler secret put GROQ_API_KEY
 * 4. wrangler deploy
 * 5. בפרויקט הראשי:
 *    VITE_CHAT_API_URL=https://YOUR_WORKER.workers.dev
 *    VITE_INVEST_CHAT_API_URL=https://YOUR_WORKER.workers.dev/invest-chat
 */

import {
  BANK_SYSTEM_PROMPT,
  buildGroqMessages,
  DEFAULT_GROQ_MODEL,
  GROQ_URL,
  INVEST_SYSTEM_PROMPT,
  WANTS_LIST_PATTERN,
} from '../../shared/groqPrompts.js';

/**
 * @param {Request} request
 * @param {{ GROQ_API_KEY: string, GROQ_MODEL?: string }} env
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405, request);
    }

    if (!env.GROQ_API_KEY) {
      return json({ error: 'missing GROQ_API_KEY' }, 500, request);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400, request);
    }

    const url = new URL(request.url);
    const isInvest =
      url.pathname.includes('invest') ||
      Boolean(String(body.investFactsText || '').trim());

    const message = String(body.message || '').slice(0, 500);
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

    if (!message) {
      return json({ error: 'empty message' }, 400, request);
    }

    const model = env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

    if (isInvest) {
      const investFactsText = String(body.investFactsText || '').trim().slice(0, 14000);
      const factsBlock =
        investFactsText || 'אין עובדות תיק — אל תמציא מספרים.';
      const modeNote =
        'המשתמש באזור המסחר — ענה כיועץ השקעות לפי צילום התיק/השוק בלבד. הזכר שזה דמו.';

      const messages = buildGroqMessages({
        systemPrompt: INVEST_SYSTEM_PROMPT,
        history,
        modeNote,
        factsBlock,
        message,
      });

      return callGroq({ env, model, messages, maxTokens: 420, request, invest: true });
    }

    const allowSensitive = Boolean(body.allowSensitive);
    const accountFactsText = String(body.accountFactsText || '').trim().slice(0, 14000);
    const modeNote = allowSensitive
      ? 'המשתמש במצב רגיש — מותר לענות על החשבון לפי צילום העובדות בלבד.'
      : 'המשתמש במצב רגיל (בלי לחשוף יתרה/פרטי כרטיס מלאים).';

    const factsBlock =
      accountFactsText ||
      (allowSensitive
        ? 'אין צילום חשבון בבקשה — אל תמציא מספרים.'
        : 'אין עובדות חשבון בבקשה — אל תמציא מספרים.');

    const wantsList = WANTS_LIST_PATTERN.test(message);
    const maxTokens = allowSensitive && wantsList ? 700 : allowSensitive ? 350 : 180;

    const messages = buildGroqMessages({
      systemPrompt: BANK_SYSTEM_PROMPT,
      history,
      modeNote,
      factsBlock,
      message,
    });

    return callGroq({ env, model, messages, maxTokens, request, invest: false });
  },
};

/**
 * @param {{
 *   env: { GROQ_API_KEY: string },
 *   model: string,
 *   messages: Array<{ role: string, content: string }>,
 *   maxTokens: number,
 *   request: Request,
 *   invest: boolean
 * }} args
 */
async function callGroq(args) {
  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.invest ? 0.35 : 0.3,
      max_tokens: args.maxTokens,
      reasoning_effort: 'low',
      stream: false,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return json({ error: 'groq failed', detail: errText.slice(0, 300) }, 502, args.request);
  }

  const groqData = await groqRes.json();
  const reply = String(groqData?.choices?.[0]?.message?.content || '').trim();

  if (args.invest) {
    return json({ reply }, 200, args.request);
  }

  return json(
    {
      reply,
      action: null,
      needsSensitiveConsent: false,
    },
    200,
    args.request,
  );
}

/**
 * @param {Request} request
 */
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * @param {object} data
 * @param {number} status
 * @param {Request} request
 */
function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}
