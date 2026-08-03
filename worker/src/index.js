/**
 * Cloudflare Worker — Proxy בטוח ל־Gemini.
 * המפתח נשאר בשרת בלבד (GEMINI_API_KEY).
 *
 * פריסה (בקצרה):
 * 1. npm i -g wrangler
 * 2. cd worker && wrangler login
 * 3. wrangler secret put GEMINI_API_KEY
 * 4. wrangler deploy
 * 5. בפרויקט הראשי: VITE_CHAT_API_URL=https://YOUR_WORKER.workers.dev
 */

const SYSTEM_PROMPT = `You are a demo bank assistant ("הבנקאי") for a learning website called "הבנק שלנו".
Rules:
- Hebrew or English according to the user.
- This is NOT a real bank. Never give financial advice, investment advice, or recommendations.
- Only answer demo banking questions and suggest/perform allowed actions.
- Allowed actions (return in JSON field "action" when relevant): navigate_account, navigate_cards, navigate_profile, navigate_loan.
- If the user asks for balance or full card details and allowSensitive is false, set needsSensitiveConsent=true and do not invent sensitive numbers.
- Keep replies concise and helpful.
Respond ONLY with JSON: {"reply":"...","action":null|"navigate_account"|...,"needsSensitiveConsent":false}`;

/**
 * @param {Request} request
 * @param {{ GEMINI_API_KEY: string }} env
 */
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405, request);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'missing GEMINI_API_KEY' }, 500, request);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json' }, 400, request);
    }

    const message = String(body.message || '').slice(0, 500);
    const allowSensitive = Boolean(body.allowSensitive);
    const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

    if (!message) {
      return json({ error: 'empty message' }, 400, request);
    }

    const contents = [
      ...history.map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(item.content || '') }],
      })),
      {
        role: 'user',
        parts: [
          {
            text: `allowSensitive=${allowSensitive}\nUser message: ${message}`,
          },
        ],
      },
    ];

    const geminiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent' +
      `?key=${env.GEMINI_API_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return json({ error: 'gemini failed', detail: errText.slice(0, 300) }, 502, request);
    }

    const geminiData = await geminiRes.json();
    const raw =
      geminiData?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}';

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw, action: null, needsSensitiveConsent: false };
    }

    return json(
      {
        reply: String(parsed.reply || ''),
        action: parsed.action || undefined,
        needsSensitiveConsent: Boolean(parsed.needsSensitiveConsent),
      },
      200,
      request,
    );
  },
};

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
