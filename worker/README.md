# צ׳אט AI — Cloudflare Worker

## 1. מפתח Gemini (חינם יחסית)
1. היכנסו ל־https://aistudio.google.com/apikey
2. צרו API key

## 2. פריסת Worker
```bash
npm i -g wrangler
cd worker
wrangler login
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

## 3. חיבור לפרונט
בשורש הפרויקט צרו `.env` (לא נכנס לגיט):
```
VITE_CHAT_API_URL=https://ha-bank-chat.YOUR_SUBDOMAIN.workers.dev
```

הריצו מחדש את `npm run dev`.
בלי המשתנה — הצ׳אט עובד עם תשובות דמה מקומיות.
