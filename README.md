# הבנק שלנו

דמו לימודי של ממשק בנקאי בעברית (RTL) — **Vite + Vanilla JavaScript**.

> **חשוב:** זה אינו בנק ואינו שירות פיננסי. אין כסף אמיתי, אין אימות אמיתי, ואין ייעוץ פיננסי.  
> האתר מיועד ללמידה והדגמה בלבד.

## קישור לדמו חי

https://buv100.github.io/ha-bank-shelanu/

ריפו: https://github.com/buv100/ha-bank-shelanu

## מה יש בפרויקט

- התחברות דמה — בחירת אחד מ־3 משתמשי דמו (נתונים נפרדים לכל אחד)
- עו״ש — יתרה + תנועות + באנר הלוואה לפי המשתמש המחובר
- כרטיסים — חיוב ואשראי, בחירה, הצגת פרטים מלאים עם טיימר
- פרופיל — פרטים, העדפות, יציאה
- דף הלוואה (דמו)
- מצב בהיר / כהה
- באנר דמו + הצהרת נגישות / פרטיות / תנאי שימוש
- צ׳אט AI («הבנקאי של …») — תשובות דמה לפי המשתמש; מוכן לחיבור Gemini דרך Worker

## הרצה מקומית

דרישות: Node.js 18+ מומלץ.

```bash
npm install
npm run dev
```

פתחו את הכתובת שמופיעה בטרמינל (בדרך כלל `http://127.0.0.1:5173/`).

פקודות נוספות:

```bash
npm run build    # בניית dist לפרודקשן
npm run preview  # תצוגה מקדימה של הבנייה
```

## מבנה תיקיות (עיקרי)

```
index.html / account.html / cards.html / …
src/
  pages/       # מסכים
  data/        # נתוני דמה (mock)
  ui/          # רכיבי ממשק
  services/    # API צ׳אט ופעולות
  utils/       # עזרים
  styles/      # CSS
worker/        # Cloudflare Worker (Proxy ל־Gemini)
public/        # לוגו, robots.txt
specs.md       # אפיון מוצר
rules.md       # חוקי קוד ועבודה
change.md      # יומן שינויים
```

## צ׳אט AI

בלי הגדרות נוספות הצ׳אט עובד עם **תשובות דמה מקומיות**.

לחיבור Gemini (מומלץ לפרודקשן — המפתח לא בדפדפן):

1. מפתח ב־[Google AI Studio](https://aistudio.google.com/apikey)
2. פריסת Worker לפי `worker/README.md`
3. קובץ `.env` בשורש (ראו `.env.example`):

```env
VITE_CHAT_API_URL=https://YOUR_WORKER.workers.dev
```

4. הריצו מחדש `npm run dev`

דוגמאות פקודות בצ׳אט: «מה היתרה?», «הצג פרטי כרטיס», «הסתר יתרה», «מצב כהה», «עבור להלוואה».

## מסמכים

| קובץ | תפקיד |
|------|--------|
| `specs.md` | אפיון המוצר וה־Roadmap |
| `rules.md` | חוקי קוד, עיצוב ותיעוד |
| `change.md` | יומן שינויים (append) |
| `accessibility.html` | הצהרת נגישות |
| `privacy.html` | מדיניות פרטיות |
| `terms.html` | תנאי שימוש ודיסקליימר |

## טכנולוגיה

- Vite 6
- HTML / CSS / JavaScript (Vanilla)
- בלי React / Vue / Firebase בשלב זה
- נתונים מ־mock בקוד (`mockUsers`); משתמש מחובר ב־`sessionStorage`
- העדפות UI ב־`sessionStorage`
- GitHub Pages לפריסה אוטומטית מ־`master`

## רישיון / שימוש

לשימוש לימודי והדגמה. אל תזינו כאן סיסמאות או פרטי בנק אמיתיים.
