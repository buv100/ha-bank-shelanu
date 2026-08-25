# בסיס נתונים — הבנק שלנו

האתר עדיין רץ על mock + `localStorage`. התיקייה הזו היא **הסכמה** ל־Postgres ב־Supabase (חינם).  
אין כאן חיבור לקוד ה־frontend.

## מה יש כאן

| קובץ | מטרה |
|------|------|
| `schema.sql` | טבלאות, אינדקסים, RLS, טריגר אחרי הרשמה + auto-confirm |
| `seed.sql` | סניפים, מכשירי שוק, תבניות קניות לסימולטור |
| `auto_confirm.sql` | אישור מייל אוטומטי (דמו — בלי קישור במייל) |
| `disable_auto_confirm.sql` | (אופציונלי) מבטל auto-confirm אם רוצים אימות מייל |
| `onboarding.sql` | פתיחת חשבון: `setup_completed` + הוצאות קבועות |
| `README.md` | איך לפתוח פרויקט ולהריץ את ה־SQL |

## פתיחת פרויקט חינמי

1. הירשמו ב־[supabase.com](https://supabase.com) (שכבת חינם).
2. New project → בחרו סיסמת DB ושמרו אותה במקום בטוח.
3. Authentication → Sign In / Providers:
   - **Email:** מופעל, **Confirm email = OFF** (כניסה מיד אחרי הרשמה).
   - **Phone:** לא נדרש (אין SMS בדמו).
4. SQL Editor → `schema.sql` ואז `seed.sql`.
   אם הסכמה כבר רצה בלי auto-confirm: הריצו גם `auto_confirm.sql`.
   אם הסכמה ישנה: הריצו גם `onboarding.sql`.

## אימות

- סיסמה נשמרת רק ב־`auth.users`.
- **הרשמה:** שם מלא, שם משתמש, אימייל, סיסמה → כניסה מיד (בלי אימות מייל).
- **כניסה:** שם משתמש + סיסמה בלבד (בלי SMS).
- `profiles.username` ייחודי. בהתחברות: `email_for_username` ואז `signInWithPassword`.
- אחרי `signUp` הטריגר `handle_new_user` יוצר פרופיל.
- אחרי כניסה ראשונה: דף פתיחת חשבון (שם שם הטלפון).

## אבטחה בקצרה

- RLS דולק על כל הטבלאות. לקוח רואה רק שורות עם `user_id = auth.uid()`.
- קטלוגים (`branches`, `market_instruments`, `purchase_templates`) — קריאה לכל מחובר.
- אין שמירת מספר כרטיס מלא ואין CVV.
- `audit_log`: הוספה + קריאה בלבד; אין עדכון/מחיקה מהלקוח.

## חיבור האתר (Vite)

ב־`.env` בשורש (לא לגיט):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

ה־URL בלי `/rest/v1/`. אחרי שינוי `.env` הריצו מחדש `npm run dev`.

## מה עדיין לא כאן

- כתיבה מלאה של עו״ש/כרטיסים/סימולטור חזרה ל־DB (כרגע נטען מה־DB בכניסה; קניות מקומיות עדיין ב־localStorage)
