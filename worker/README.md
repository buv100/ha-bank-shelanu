# צ׳אט AI — Groq

## פיתוח מקומי
1. צרו מפתח ב־https://console.groq.com/keys
2. שימו ב־`.env` בשורש:
```
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
VITE_CHAT_API_URL=/api/chat
```
3. הריצו `npm run dev`

הפרוקסי ב־Vite קורא ל־Groq מהשרת — המפתח לא נשלח לדפדפן.
למסחר יש גם `/api/invest-chat` (יועץ השקעות נפרד).

## פריסת Cloudflare Worker (אופציונלי)
```bash
npm i -g wrangler
cd worker
wrangler login
wrangler secret put GROQ_API_KEY
wrangler deploy
```

ואז ב־`.env`:
```
VITE_CHAT_API_URL=https://ha-bank-chat.YOUR_SUBDOMAIN.workers.dev
VITE_INVEST_CHAT_API_URL=https://ha-bank-chat.YOUR_SUBDOMAIN.workers.dev/invest-chat
```
