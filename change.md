# יומן שינויים — הבנק שלנו

מסמך זה מתעד **כל שינוי** בפרויקט (append בלבד).  
הפורמט המחייב מוגדר ב־`rules.md`.

---

## 2/8/26

### יצירת אפיון וחוקים
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להגדיר את המוצר (חזון, מסכים, ארכיטקטורה, נתונים, Roadmap) ואת כללי העבודה (טכנולוגיה, למידה והערות בעברית, מודולריות, עיצוב, תיעוד) לפני כתיבת קוד שלב 1
- **איפה בקוד:** specs.md, rules.md, change.md
- **איפה באתר:** אין שינוי ויזואלי — מסמכי תכנון בלבד; האתר עדיין לא נבנה

### בניית דמו שלב 1 — התחברות ועו״ש
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** לממש את שלב 1 מהאפיון — דף התחברות דמה (כניסה בלי אימות) ודף עובר ושב עם יתרה 15,000 ₪ ועשר תנועות דמה, על Vite + Vanilla JS
- **איפה בקוד:** package.json, vite.config.js, index.html, .gitignore, public/logo.svg, src/main.js, src/styles/main.css, src/pages/login.js, src/pages/account.js, src/data/mockAccount.js, src/ui/navigation.js, src/ui/transactionItem.js, src/utils/format.js, specs.md (סימון קריטריוני סיום)
- **איפה באתר:** מסך התחברות (אימייל/סיסמה + כפתור היכנס) ומסך עו״ש (יתרה + רשימת תנועות); עיצוב לבן/טורקיז עם לוגו; מעבר בין המסכים בלחיצה

### תיאורי תנועות כלליים בלבד
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להסיר שמות עסקים/מקומות אמיתיים מהוצאות ולהשאיר רק תיאורים כלליים (למשל "קניות")
- **איפה בקוד:** src/data/mockAccount.js
- **איפה באתר:** ברשימת התנועות בדף עו״ש — שמות כמו קניות, תחבורה, חשבונות במקום שמות חנויות

### תיקון הרצת שרת הפיתוח
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** פורט 5173 היה תפוס/לא הגיב נכון; קיבענו host ו־port ב־vite.config כדי שהדמו ייפתח בוודאות
- **איפה בקוד:** vite.config.js
- **איפה באתר:** אין שינוי ויזואלי — רק שהקישור המקומי יעבוד

### לוגו מומצא + דפי HTML נפרדים
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להציג לוגו ברור בצבעי המותג, ולהפריד התחברות מעו״ש לשני דפים אמיתיים (לא תוכן מתחת באותו דף)
- **איפה בקוד:** public/logo.svg, src/ui/brand.js, src/ui/navigation.js, src/pages/login.js, src/pages/account.js, src/main.js, src/accountMain.js, index.html, account.html, vite.config.js, src/styles/main.css, specs.md
- **איפה באתר:** לוגו עמודים מופשט ליד "הבנק שלנו"; לחיצה על "היכנס" פותחת את /account.html כדף נפרד

### מעטפת אפליקציה + תפריט ניווט
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להוסיף מעטפת כמו באפליקציית בנק (כותרת עליונה + תפריט תחתון) כדי שיהיה קל לעבור בין עו״ש, כרטיסים ופרופיל — לפני מילוי תוכן מלא לדפים החדשים
- **איפה בקוד:** src/ui/appShell.js, src/styles/shell.css, src/ui/navigation.js, src/pages/account.js, src/pages/cards.js, src/pages/profile.js, src/accountMain.js, src/cardsMain.js, src/profileMain.js, cards.html, profile.html, vite.config.js, src/styles/main.css, specs.md, change.md
- **איפה באתר:** אחרי התחברות — כותרת עליונה עם לוגו וכותרת דף; תפריט תחתון עם עו״ש / כרטיסים / פרופיל; בדפי כרטיסים ופרופיל מופיע כרגע רק מקום שמור לתוכן

### כותרת גדולה + פרסומת הלוואה במעטפת
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** למלא את החלק העליון הריק — שם בנק גדול יותר, ובצד שמאל פרסומת להלוואה עד פי 3 מהיתרה
- **איפה בקוד:** src/ui/appShell.js, src/styles/shell.css, change.md
- **איפה באתר:** בראש כל דף מחובר — "הבנק שלנו" גדול; באנר הלוואה עם סכום מקסימלי, תשלומים נוחים, ריבית נמוכה וכפתור "לפרטים"

### באנר הלוואה אנכי + דף בקשה
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** לצמצם את הפרסומת לפורמט צר ואנכי, ולחבר את "לפרטים" לדף טופס הלוואה (בלי להוסיף אותה לתפריט התחתון)
- **איפה בקוד:** src/ui/appShell.js, src/ui/navigation.js, src/pages/loan.js, src/loanMain.js, loan.html, src/styles/shell.css, src/styles/loan.css, vite.config.js, change.md
- **איפה באתר:** באנר צר משמאל; לחיצה על "לפרטים" פותחת /loan.html עם טופס; אחרי שליחה מוצגת הודעה שנחזור אליכם

### כותרת פשוטה + כרטיס הלוואה צף
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להחזיר את הכותרת העליונה למראה הנקי מההתחלה, ולהוציא את ההלוואה לכרטיס מעופף קבוע בצד שמאל למעלה שנשאר גם בגלילה
- **איפה בקוד:** src/ui/appShell.js, src/styles/shell.css, change.md
- **איפה באתר:** למעלה רק לוגו + "הבנק שלנו" + שם הדף; כרטיס הלוואה צף משמאל עם קישור לפרטים

### כרטיס הלוואה חצי־שקוף
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** שהפרסומת לא תסתיר את תוכן החשבון ולא תהיה בולטת מדי
- **איפה בקוד:** src/styles/shell.css
- **איפה באתר:** כרטיס ההלוואה הצף נראה שקוף יותר עם טשטוש רקע עדין

### כרטיס הלוואה כמעט בלתי־נראה
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להנמיך עוד יותר את הבולטות — שישימו לב רק אם מחפשים; במעבר עכבר מתחזק קצת לנוחות לחיצה
- **איפה בקוד:** src/styles/shell.css
- **איפה באתר:** כרטיס ההלוואה שקוף מאוד; hover מגביר מעט את הניראות

### כרטיס הלוואה ליד היתרה (לא צף בגלילה)
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** שהפרסומת תישאר ליד היתרה ותיגלל עם הדף, במקום לעקוב אחרי הגלילה; נשמר אפקט בהיר→כהה ב־hover
- **איפה בקוד:** src/ui/loanFloat.js, src/pages/account.js, src/ui/appShell.js, src/pages/loan.js, src/styles/shell.css, change.md
- **איפה באתר:** בדף עו״ש — כרטיס הלוואה משמאל ליתרה; בגלילה למטה הוא נעלם עם היתרה ולא נשאר על המסך

### צבע כרטיס הלוואה כמו היתרה + hover בולט
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להתאים את מראה כרטיס ההלוואה לפאנל היתרה, ובהעברת עכבר להפוך אותו לבולט יותר
- **איפה בקוד:** src/styles/shell.css
- **איפה באתר:** כרטיס ההלוואה באותו גרדיאנט/מסגרת כמו היתרה; ב־hover צבע חזק יותר וצל בולט

### כפתור הגדרות + מיני־תפריט
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להוסיף גישה מהירה להגדרות דמו מהכותרת (בלי להוסיף פריט לתפריט התחתון)
- **איפה בקוד:** src/ui/settingsMenu.js, src/ui/appShell.js, src/styles/shell.css, src/accountMain.js, src/cardsMain.js, src/profileMain.js, src/loanMain.js, change.md
- **איפה באתר:** בכותרת משמאל — כפתור "הגדרות"; נפתח תפריט עם הסתרת יתרה, הסתרת פרסומת הלוואה, התראות (דמו) ויציאה

### תיקון הסתרת הלוואה + מצב כהה/בהיר
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** תיקון באג — display:flex של כרטיס ההלוואה דרס את hidden; הוספת מצב כהה עם שמירה בין דפים בטאב
- **איפה בקוד:** src/ui/settingsMenu.js, src/utils/theme.js, src/styles/main.css, src/styles/shell.css, src/main.js, src/accountMain.js, src/cardsMain.js, src/profileMain.js, src/loanMain.js, change.md
- **איפה באתר:** "הסתרת פרסומת הלוואה" באמת מסתירה את הכרטיס; בתפריט הגדרות יש "מצב כהה" שמחליף בהיר/כהה

### כפתור נפרד למצב כהה/בהיר
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להוציא את החלפת ערכת הנושא מתפריט ההגדרות לכפתור ייעודי ליד ההגדרות
- **איפה בקוד:** src/ui/themeToggle.js, src/ui/settingsMenu.js, src/ui/appShell.js, src/styles/shell.css, src/accountMain.js, src/cardsMain.js, src/profileMain.js, src/loanMain.js, change.md
- **איפה באתר:** בכותרת משמאל — כפתור "מצב כהה"/"מצב בהיר" ליד כפתור ההגדרות

### אייקון גלגל שיניים להגדרות
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** להחליף את סימן ההגדרות לגלגל שיניים ברור
- **איפה בקוד:** src/ui/settingsMenu.js
- **איפה באתר:** בכפתור ההגדרות בכותרת מופיע אייקון גלגל שיניים

### התאמת סגנון אייקון ההגדרות לכפתור הערכת נושא
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** שגלגל השיניים יהיה באותו סגנון קו דק כמו אייקון השמש/ירח
- **איפה בקוד:** src/ui/settingsMenu.js
- **איפה באתר:** אייקון ההגדרות נראה כמו שאר האייקונים בכותרת

### דף כרטיסים — כרטיס דמה + פרטים
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** לממש את שלב הכרטיסים מהאפיון — תצוגה ויזואלית ופרטים בסיסיים במקום מקום שמור
- **איפה בקוד:** src/data/mockCards.js, src/ui/bankCard.js, src/pages/cards.js, src/styles/cards.css, src/cardsMain.js, specs.md, change.md
- **איפה באתר:** בתפריט "כרטיסים" — כרטיס חיוב ויזואלי, רשימת פרטים, וסטטוס פעיל; כפתור חסימה מושבת ("בקרוב")

### הצגת פרטי כרטיס מלאים עם אישור וטיימר
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** לאפשר הצגה זמנית של מספר מלא, תוקף ו־CVV אחרי אישור ודיסקליימר, עם סגירה אוטומטית אחרי דקה
- **איפה בקוד:** src/data/mockCards.js, src/ui/cardReveal.js, src/pages/cards.js, src/styles/cards.css, src/cardsMain.js, change.md
- **איפה באתר:** בדף כרטיסים — כפתור "הצגת פרטי כרטיס"; חלון אישור; ואז כרטיס במרכז עם פרטים מלאים וטיימר 01:00

### עיצוב כרטיס יוקרתי + היפוך ל־CVV
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** לשדרג את מראה הכרטיס (צעיר־יוקרתי) ולהסתיר CVV בחזית — יוצג רק אחרי היפוך בלחיצה
- **איפה בקוד:** src/ui/bankCard.js, src/ui/cardReveal.js, src/styles/cards.css, change.md
- **איפה באתר:** כרטיס מחודש בדף כרטיסים ובמודל; בלחיצה על הכרטיס במודל הוא מתהפך ומציג CVV בגב

### תיקון הצגת כרטיס במודל + עיצוב בולד יותר
- **תאריך השינוי:** 2/8/26
- **למה שינינו:** לתקן כרטיס שלא נראה במודל הפרטים המלאים (בעיית היפוך/RTL ו־filter:blur), ולחזק עיצוב צעיר ובולט
- **איפה בקוד:** src/ui/cardReveal.js, src/ui/bankCard.js, src/styles/cards.css, change.md
- **איפה באתר:** אחרי אישור — כרטיס נראה במרכז; לחיצה הופכת ל־CVV; עיצוב זוהר ובולד יותר גם בדף הראשי

## 3/8/26

### סכום הלוואה מקסימלי עגול
- **מה השתנה:** מקסימום ההלוואה מחושב כיתרה × 3 ומעוגל לאלף הקרוב
- **קבצים:** src/utils/loan.js, src/ui/loanFloat.js, src/pages/loan.js, change.md
- **למה:** שהסכום המוצג יהיה מספר עגול וקריא, לא סכום עם אגורות
- **בקוד:** פונקציה משותפת `getMaxLoanAmount`
- **באתר:** בכרטיס ההלוואה ליד היתרה ובדף בקשת ההלוואה — למשל ~151,736 → ₪152,000

### הצגת שני כרטיסים + אשראי
- **מה השתנה:** הכרטיס החדש מוצג בדף; הוגדר ככרטיס אשראי; הצגת פרטים מלאים לפי כרטיס שנבחר
- **קבצים:** src/data/mockCards.js, src/pages/cards.js, src/ui/cardReveal.js, src/ui/bankCard.js, src/styles/cards.css, change.md
- **למה:** להציג את כל כרטיסי הדמו ולהבדיל אשראי מחיוב
- **בקוד:** לולאה על `mockCards`; מודל משותף עם `data-show-card-details`; מחלקת `bank-card--credit`
- **באתר:** בדף כרטיסים — חיוב + אשראי (גוון כהה יותר); לכל אחד כפתור הצגת פרטים

### בחירת כרטיס בודד לתצוגה
- **מה השתנה:** בדף כרטיסים בוחרים כרטיס ורואים רק אותו (בלי גלילה בין כולם)
- **קבצים:** src/pages/cards.js, src/ui/cardPicker.js, src/cardsMain.js, src/styles/cards.css, change.md
- **למה:** למנוע דף ארוך עם כמה כרטיסים אחד מתחת לשני
- **בקוד:** בורר `card-picker` + `bindCardPicker`; פאנלים עם `hidden`
- **באתר:** בראש דף כרטיסים — בחירה בין חיוב/אשראי; מתחת מוצג רק הכרטיס שנבחר

### דף פרופיל — דמו ראשון
- **מה השתנה:** דף פרופיל מלא עם פרטי משתמש, סיכום חשבון, העדפות ויציאה; העדפות מסונכרנות עם תפריט ההגדרות
- **קבצים:** src/data/mockProfile.js, src/pages/profile.js, src/ui/profilePage.js, src/utils/userPrefs.js, src/ui/settingsMenu.js, src/styles/profile.css, src/profileMain.js, change.md
- **למה:** להשלים את שלב הפרופיל מהאפיון לפני חיבור ל־GitHub וצ׳אט AI
- **בקוד:** `mockProfile` + `userPrefs` ב־sessionStorage; `bindProfilePage` למתגים וליציאה
- **באתר:** בתפריט "פרופיל" — אווטאר וראשי תיבות, פרטי קשר, סיכום חשבון, העדפות, יציאה

### צבע יציאה בפרופיל כמו בתפריט ההגדרות
- **מה השתנה:** כפתור "יציאה מהחשבון" בפרופיל בטורקיז גם במצב רגיל (לפני hover), לא אפור
- **קבצים:** src/styles/profile.css, src/styles/shell.css, change.md
- **למה:** שהכפתור ייראה טורקיז תמיד, לא רק בריחוף
- **בקוד:** `.profile-logout` עם `background: var(--color-accent-soft)` כברירת מחדל; יציאה בגלגל ב־`accent-dark`
- **באתר:** בדף פרופיל — כפתור היציאה רקע טורקיז רך גם בלי לעמוד עליו

### בסיס משפטי ונגישות לעלייה עתידית
- **מה השתנה:** באנר דמו קבוע, פוטר עם קישורים, עמודי הצהרת נגישות / פרטיות / תנאי שימוש, דילוג לתוכן, אישור תנאים בהתחברות ובהלוואה, robots noindex
- **קבצים:** accessibility.html, privacy.html, terms.html, public/robots.txt, src/ui/demoBanner.js, src/ui/siteFooter.js, src/ui/skipLink.js, src/ui/legalShell.js, src/ui/appShell.js, src/ui/navigation.js, src/pages/accessibility.js, src/pages/privacy.js, src/pages/terms.js, src/pages/login.js, src/pages/loan.js, src/styles/legal.css, src/styles/main.css, src/styles/shell.css, vite.config.js, דפי HTML + Main, change.md
- **למה:** להכין את האתר לעלייה לאינטרנט בעתיד בלי לפרסם עדיין
- **בקוד:** מעטפת משפטית משותפת; `meta robots=noindex`; הסכמה בטפסים
- **באתר:** באנר "דמו בלבד" בכל המסכים; קישורים בפוטר; דפים חדשים לנגישות/פרטיות/תנאים

### חיבור ל־GitHub + Pages
- **מה השתנה:** ריפו ציבורי ב־GitHub; נתיבים מותאמים ל־BASE_URL; workflow לפריסת GitHub Pages
- **קבצים:** .github/workflows/deploy-pages.yml, src/ui/navigation.js, vite.config.js, change.md
- **למה:** לאפשר קישור לשיתוף עם חברים
- **בקוד:** `base` ב־CI; `pagePath` עם `import.meta.env.BASE_URL`
- **באתר:** אחרי הפריסה — https://buv100.github.io/ha-bank-shelanu/

### צ׳אט AI — UI + דמה + Worker מוכן
- **מה השתנה:** כפתור צ׳אט מרחף, פאנל שניתן להרחבה, הסכמות, תשובות דמה, פעולות ניווט, שלד Cloudflare Worker ל־Gemini
- **קבצים:** src/ui/chatWidget.js, src/styles/chat.css, src/data/chatMock.js, src/services/chatApi.js, src/services/chatActions.js, src/utils/chatPrefs.js, worker/*, .env.example, דפי Main מחוברים, privacy/terms, change.md
- **למה:** עוזר בנקאי לדמו לפי האפיון (בלי ייעוץ, עם אישור לנתונים רגישים)
- **בקוד:** `mountChatWidget`; נפילה לדמה בלי `VITE_CHAT_API_URL`
- **באתר:** עיגול סגול־ציאן מעל התפריט; אחרי אישור — "הבנקאי של ישראל ישראלי"

### תשובות צ׳אט קצרות וממוקדות
- **מה השתנה:** הפרומפט והתשובות המקומיות מחייבים מענה קצר (1–2 משפטים)
- **קבצים:** worker/src/index.js, src/data/chatMock.js, src/ui/chatWidget.js, change.md
- **למה:** שהבוט יהיה חד וממוקד בלי טקסט מיותר
- **בקוד:** כלל מפורש ב־SYSTEM_PROMPT + `maxOutputTokens: 180` + קיצור תשובות דמה
- **באתר:** בצ׳אט — תשובות קצרות יותר

### הרחבת פעולות הצ׳אט — כרטיס והגדרות
- **מה השתנה:** הצ׳אט יכול להציג פרטי כרטיס מלאים, לשנות העדפות (יתרה/הלוואה/התראות), מצב כהה/בהיר ולפתוח הגדרות
- **קבצים:** src/data/chatMock.js, src/services/chatActions.js, src/ui/cardReveal.js, src/ui/cardPicker.js, src/cardsMain.js, src/ui/chatWidget.js, worker/src/index.js, change.md
- **למה:** להרחיב את יכולות העוזר מעבר לניווט בלבד
- **בקוד:** פעולות `reveal_card`, `hide_balance`, `theme_dark` וכו׳; `?reveal=` בדף כרטיסים
- **באתר:** בצ׳אט — למשל "הצג פרטי כרטיס", "הסתר יתרה", "מצב כהה"

### README לפרויקט
- **מה השתנה:** נוסף קובץ README עם הסבר על הדמו, הרצה, מבנה, צ׳אט וקישור חי
- **קבצים:** README.md, change.md
- **למה:** שיהיה ברור איך להריץ ולשתף את הפרויקט
- **בקוד:** תיעוד בשורש הריפו
- **באתר:** אין שינוי ויזואלי — מסמך ב־GitHub

---

## 4/8/26

### משתמשים מרובים בדמו (בלי אדמין)
- **מה השתנה:** 3 משתמשי דמו עם נתונים נפרדים; בחירה במסך התחברות; session מקומי; דפים וצ׳אט לפי המשתמש המחובר; הגנת ניווט לדפים מוגנים
- **קבצים:** src/data/mockUsers.js, src/utils/session.js, src/pages/login.js, src/pages/account.js, src/pages/cards.js, src/pages/profile.js, src/pages/loan.js, src/accountMain.js, src/cardsMain.js, src/profileMain.js, src/loanMain.js, src/ui/navigation.js, src/ui/chatWidget.js, src/ui/cardReveal.js, src/ui/loanFloat.js, src/data/chatMock.js, src/services/chatActions.js, src/data/mockAccount.js, src/data/mockProfile.js, src/data/mockCards.js, src/styles/main.css, README.md, specs.md, change.md
- **למה:** לאפשר תרגול עם כמה פרסונות דמה בלי שרת ובלי אדמין
- **בקוד:** `loginAs` / `logout` / `getCurrent*` ב־sessionStorage; `requireAuth` בדפי האפליקציה; מקור האמת ב־`mockUsers`
- **באתר:** במסך כניסה — כרטיסי «היכנס כ־…»; אחרי בחירה — עו״ש/כרטיסים/פרופיל/צ׳אט של אותו משתמש; בלי session — הפניה להתחברות

### הרחבת משתמשי דמו ונתונים
- **מה השתנה:** נוספו 3 משתמשים (סה״כ 6); לכל אחד יתרה/תנועות/2–3 כרטיסים; גלילה ברשימת ההתחברות
- **קבצים:** src/data/mockUsers.js, src/styles/main.css, README.md, change.md
- **למה:** דמו עשיר יותר להשוואה בין פרסונות
- **בקוד:** עדכון `mockUsers` בלבד — המסכים/session כבר דינמיים
- **באתר:** במסך כניסה — 6 אפשרויות; בדף כרטיסים — עד 3 כרטיסים לפי המשתמש

### עיצוב מיוחד לכרטיס פלטינום
- **מה השתנה:** וריאנט `platinum` עם מראה מתכתי כהה, ברק כסף, תג PLATINUM ואנימציות עדינות
- **קבצים:** src/ui/bankCard.js, src/ui/cardReveal.js, src/styles/cards.css, src/data/mockUsers.js, change.md
- **למה:** להבדיל את כרטיס הפרימיום משאר הכרטיסים
- **בקוד:** `getBankCardVariantClass` + מחלקת `.bank-card--platinum`
- **באתר:** אצל שירה בן דוד — כרטיס הפלטינום נראה יוקרתי יותר (גם בהצגה מלאה)

### סימולציית קניות אוטומטית (חיוב/אשראי)
- **מה השתנה:** קניות רנדומליות אוטומטיות לכל משתמש; חיוב יורד מהעו״ש; אשראי מעלה חוב כרטיס; שמירה ב־localStorage מוכנה ל־DB
- **קבצים:** src/utils/accountStore.js, src/utils/cardStore.js, src/services/purchaseSimulator.js, src/services/autoActivity.js, src/utils/session.js, src/pages/account.js, src/pages/cards.js, src/accountMain.js, src/cardsMain.js, src/ui/loanFloat.js, src/styles/main.css, src/styles/cards.css, README.md, change.md
- **למה:** לדמות «תשלום בכרטיס» בלי מסוף אמיתי, עם הפרדה נכונה בין חיוב לאשראי
- **בקוד:** `simulateCardPurchase` + `startAutoActivity` (טיימר + catch-up); אירוע `ha-bank:data-changed` לרענון UI
- **באתר:** בעו״ש — תנועות חדשות מכרטיס חיוב; בכרטיסי אשראי — מסגרת/חוב/תנועות שמתעדכנים לבד

### דף ריכוז יתרות
- **מה השתנה:** מסך חדש שמציג כמה נשאר באמת: יתרת עו״ש פחות חוב אשראי, עם מקום להשקעות בעתיד
- **קבצים:** overview.html, src/overviewMain.js, src/pages/overview.js, src/utils/balances.js, src/styles/overview.css, src/ui/appShell.js, src/ui/navigation.js, vite.config.js, README.md, change.md
- **למה:** לתת מבט אחד על המצב הכלכלי של המשתמש בדמו
- **בקוד:** `getBalancesSummary()` — נטו = עו״ש − סך חוב אשראי (+ השקעות כשיופעלו)
- **באתר:** בתפריט התחתון — «ריכוז»; המספרים מתעדכנים כשיש קניות אוטומטיות

### עיצובי כרטיס לפי מוצר + תיקון פלטינום
- **מה השתנה:** לכל מוצר עיצוב נפרד (חיוב/אשראי/זהב/נסיעות/דיגיטלי/פלטינום); תוקף ושם בעל הכרטיס לא יוצאים מגבולות הכרטיס
- **קבצים:** src/ui/bankCard.js, src/ui/cardReveal.js, src/styles/cards.css, src/data/mockUsers.js, change.md
- **למה:** להבדיל בין סוגי כרטיסים ולתקן גלישת טקסט בפלטינום
- **בקוד:** `resolveCardVariant` + מחלקות `.bank-card--gold/travel/digital/...`; פריסה צפופה יותר עם ellipsis
- **באתר:** בדף כרטיסים — כל מוצר נראה אחרת; בפלטינום הפרטים התחתונים נשארים בתוך הכרטיס

---

## 9/8/26

### עדכון אפיון לפי מצב הדמו
- **מה השתנה:** `specs.md` הותאם להתקדמות בלי לשכתב את שלב 1 ההיסטורי — צ׳אט Groq (מצבים רגיל/רגיש), משכורת ב־10 לחודש, ריכוז/הלוואה/כרטיסים/פרופיל כקיימים, ארכיטקטורת `server/` + מפתח ב־`.env`
- **קבצים:** specs.md, change.md
- **למה:** שמירת מקור האמת מסונכרן עם מה שבונים בפועל
- **בקוד:** אין שינוי התנהגות — תיעוד בלבד
- **באתר:** אין שינוי ויזואלי

---

## 11/8/26

### סכמת Postgres (Supabase) בלי חיבור ל־UI
- **מה השתנה:** נוספה תיקיית `db/` עם טבלאות, RLS, טריגר הרשמה, ו־seed לקטלוגים (סניפים, שוק, תבניות סימולטור)
- **קבצים:** db/schema.sql, db/seed.sql, db/README.md, specs.md, change.md
- **למה:** להכין בסיס נתונים מאובטח לפני התחברות אמיתית
- **בקוד:** אין שינוי ב־`src/` — הדמו ממשיך על mock + localStorage
- **באתר:** אין שינוי ויזואלי

### התחברות אמיתית מול Supabase
- **מה השתנה:** מסך כניסה/הרשמה עם שם משתמש וסיסמה; סשן מ־Auth; טעינת פרופיל ועו״ש מה־DB
- **קבצים:** src/services/supabaseClient.js, src/services/authApi.js, src/services/supabaseHydrate.js, src/pages/login.js, src/utils/session.js, src/*Main.js, .env.example, db/README.md, change.md
- **למה:** לעבור מבחירת פרסונת דמו לאימות אמיתי
- **בקוד:** `email_for_username` → `signInWithPassword`; `requireAuth` אסינכרוני
- **באתר:** בדף ההתחברות — טופס כניסה או הרשמה (לא ביחד), עם כפתור מעבר

### מסך כניסה/הרשמה נפרד
- **מה השתנה:** במקום שני טאבים — מסך אחד בכל פעם + קישור מעבר
- **קבצים:** src/pages/login.js, src/styles/main.css, change.md
- **למה:** פחות עומס ויזואלי
- **בקוד:** `showLoginMode` מחליף בין הטפסים
- **באתר:** «אין לך חשבון? הרשמה» / «כבר יש חשבון? כניסה»

### הרשמה בלי אימות מייל
- **מה השתנה:** אחרי הרשמה נכנסים ישר; טריגר מאשר את האימייל ב־DB; הודעות בלי «בדקו את האימייל»
- **קבצים:** src/services/authApi.js, src/pages/login.js, src/utils/session.js, db/schema.sql, db/auto_confirm.sql, db/reset.sql, db/README.md, specs.md, change.md
- **למה:** דמו בלי תלות במייל של Supabase
- **בקוד:** אחרי `signUp` מנסים `signInWithPassword`; `auto_confirm_auth_user` על `auth.users`
- **באתר:** הרשמה עם שם מלא / שם משתמש / אימייל / סיסמה ואז כניסה לחשבון
- **ב־Supabase (חובה כדי שלא יישלח מייל):** Authentication → Sign In / Providers → Email → כבו Confirm email

## 13/8/26

### פתיחת חשבון דינמית + סימולציה למשתמשי Auth
- **מה השתנה:** אחרי התחברות ראשונה — טופס נתונים ראשוניים; סניף/יתרה/מספרי כרטיס נוצרים אוטומטית; סימולציה ומשכורת עובדות למשתמשי Supabase
- **קבצים:** setup.html, src/setupMain.js, src/pages/setup.js, src/styles/setup.css, src/services/bootstrapAccount.js, src/services/onboardingApi.js, src/services/recurringExpenses.js, src/services/autoActivity.js, src/services/salaryDeposit.js, src/services/purchaseSimulator.js, src/services/supabaseHydrate.js, src/utils/session.js, src/pages/login.js, db/onboarding.sql, db/schema.sql, db/reset.sql, db/README.md, specs.md, change.md, vite.config.js
- **למה:** כל משתמש (NACHOM / SHLOMO / DANIEL וכו׳) ממלא את שלו, בלי נתונים קשיחים בקוד
- **בקוד:** `buildOnboardingSnapshot` משלים חסרים; `runRandomPurchase` קורא מ־cardStore ולא מ־mockUsers
- **באתר:** דף «פתיחת חשבון» אחרי כניסה, עד שמסיימים
- **ב־Supabase:** להריץ `db/onboarding.sql` (פעם אחת)

### השלמת מספרי כרטיס בהצגה מלאה
- **מה השתנה:** בפתיחת חשבון ובטעינה מה־DB נוצרים אוטומטית מספר מלא + CVV לדמו (לא נשמרים ב־DB)
- **קבצים:** src/services/bootstrapAccount.js, src/services/supabaseHydrate.js, src/utils/session.js, change.md
- **למה:** מסך «הצגת פרטי כרטיס» צריך fullNumber/CVV גם למשתמשים חדשים
- **בקוד:** `ensureCardDisplayFields` / `buildDemoFullNumber` / `buildDemoCvv`
- **באתר:** אחרי פתיחת חשבון — בהצגה מלאה מופיעים מספר ותוקף ו־CVV

### ביטול אימות מייל ו־SMS
- **מה השתנה:** כניסה והרשמה רק עם שם משתמש + סיסמה; הוסר מסך SMS; הוסר טלפון מהרשמה; חזר auto-confirm במייל
- **קבצים:** src/services/authApi.js, src/pages/login.js, src/services/onboardingApi.js, db/schema.sql, db/auto_confirm.sql, db/README.md, specs.md, README.md, change.md
- **למה:** דמו פשוט — נרשמים ונכנסים בלי מייל או SMS
- **בקוד:** `signInWithUsername` / `signUpWithUsername` ישירים; אחרי `signUp` ניסיון `signInWithPassword` אם אין session
- **באתר:** הרשמה = שם מלא / שם משתמש / אימייל / סיסמה → כניסה ישר
- **ב־Supabase:** Confirm email = OFF; Phone לא נדרש; להריץ `auto_confirm.sql` אם הטריגר לא קיים

## 25/8/26

### קיבוע דמו ההשקעות/חסכונות/פתיחת חשבון שכבר היה בעבודה
- **מה השתנה:** commit לכל מה שהצטבר בעבודה ולא נכנס לגיט עד כה — מסכי השקעות (מסחר, חיפוש, פירוט), חסכונות, ריכוז יתרות, פתיחת חשבון, וכל שכבות ה־store/service הנלוות (Supabase, סימולטור קניות/משכורת, הוצאות קבועות)
- **קבצים:** overview.html, savings.html, setup.html, investments.html, investments-search.html, investment-detail.html, וכל src/pages|src/*Main.js|src/services|src/utils המתאימים (untracked קודם), db/ (סכמה + seed + README), server/ (פרוקסי Groq מקומי)
- **למה:** הקוד כבר רץ ועובד בפועל מזמן, רק לא היה ב־git — כדי שההיסטוריה תשקף את מצב הפרויקט האמיתי
- **בקוד:** אין שינוי התנהגות — רק תיעוד/הוספה ל־git של מה שכבר קיים
- **באתר:** אין שינוי ויזואלי מעבר למה שכבר היה זמין מקומית

### איחוד קוד Groq בין השרת המקומי ל־Worker
- **מה השתנה:** חילוץ הפרומפטים (`BANK_SYSTEM_PROMPT`/`INVEST_SYSTEM_PROMPT`), כתובת ה־API, המודל ברירת המחדל ובניית מערך ה־messages לקובץ משותף אחד; תוקן גם הבדל לא מכוון ב־regex של "wantsList" בין הסביבות
- **קבצים:** shared/groqPrompts.js (חדש), server/groqChat.js, worker/src/index.js
- **למה:** אותה לוגיקה בדיוק הייתה משוכפלת מילה-במילה בשני קבצים — סיכון לדריפט (וכבר היה דריפט אחד בפועל) בכל שינוי לפרומפט
- **בקוד:** `buildGroqMessages()` ו־`WANTS_LIST_PATTERN` משותפים; כל צד שומר רק את מה שספציפי לו (Node middleware מול Fetch handler של Worker)
- **באתר:** אין שינוי התנהגות מורגש — אותן תשובות צ׳אט

### דף נחיתה שיווקי לפני התחברות
- **מה השתנה:** `index.html` הפך לדף נחיתה (הירו + כרטיסי יתרונות); ההתחברות עברה לדף נפרד `login.html`
- **קבצים:** index.html, login.html (חדש), src/pages/landing.js, src/landingMain.js, src/loginMain.js (היה src/main.js), src/styles/landing.css, src/ui/navigation.js (`LANDING_PAGE` חדש, `LOGIN_PAGE`→login.html), vite.config.js, src/utils/session.js
- **למה:** ב־specs.md זה היה פריט ראשון ברשימת "עדיפויות בהמשך" — נקודת כניסה שיווקית לפני שמבקשים שם משתמש/סיסמה
- **בקוד:** `getLandingMarkup()` עם `getBrandMarkup`/`getDemoBannerMarkup`/`getSiteFooterMarkup` קיימים; שני entry points נפרדים ב־`vite.config.js` (`landing`, `login`)
- **באתר:** גולש חדש שנכנס לכתובת הבסיס רואה דף נחיתה עם כפתור «כניסה לחשבון»; הכפתור מוביל ל־`/login.html`

### העברות אמיתיות + חיפוש/סינון/פירוט תנועה בעו״ש
- **מה השתנה:** דף ההעברות (שהיה קיים כ־UI בלבד) מחובר עכשיו ל־accountStore/savingsStore בפועל — סוגי העברה רוב (מוטב/ביט/מהירה/בינלאומית/חשבונות/בין חשבונות שלי/הפקדה לחיסכון) באמת מחייבים את העו״ש או מעבירים לחיסכון, עם בדיקת יתרה והודעת שגיאה; הוראת קבע נשארת דמו בלבד. בדף העו״ש נוסף פס חיפוש טקסט + סינון קטגוריה + טוגל הכנסה/הוצאה, וחלון פירוט תנועה בלחיצה על שורה
- **קבצים:** src/pages/transfers.js, src/pages/account.js, src/ui/transactionItem.js, src/accountMain.js, src/styles/account.css (חדש)
- **למה:** שתי יכולות מתוכננות מרשימת "עדיפויות בהמשך" ב־specs.md — העברת כסף אמיתית (עדיפות 2) וסינון/פירוט תנועה (עדיפות 3)
- **בקוד:** `performTransfer()` ב־transfers.js מנתב לפי `option.id`; `applyTransactionFilters()` פונקציה טהורה ב־account.js; `notifyDataChanged`/`DATA_CHANGED_EVENT` הקיימים משמשים לרענון לייב בין דפים
- **באתר:** בדף העברות — ביצוע אמיתי משנה יתרה (חוץ מהוראת קבע); בדף עו״ש — שדה חיפוש מעל רשימת התנועות, בורר קטגוריה, כפתורי הכל/הכנסות/הוצאות, ולחיצה על תנועה פותחת חלון עם כל הפרטים

### צ׳אט חכם באמת — עונה על כל שאלת חשבון, לא רק ניסוחים תואמים
- **מה השתנה:** הוסרה החסימה שגרמה לבוט להתעלם מתשובת ה־AI (Groq) ולהחזיר תמיד תבנית קבועה בעברית עבור יתרה/תנועות/חסכונות/השקעות/ריכוז/משכורת/תזרים; עכשיו ה־AI עונה בפועל מתוך צילום החשבון המלא שכבר נשלח אליו, וההיסטוריה המקומית משמשת רק כגיבוי כשה־API לא זמין. גם חוזק הפרומפט המשותף כדי לעודד חישוב/סינון/השוואה מהעובדות ולא רק דקלום
- **קבצים:** src/data/chatMock.js, shared/groqPrompts.js
- **למה:** המשתמש ביקש בוט שעונה על כל שאלה קשורה לחשבון בלי קשר לניסוח — הקוד הקודם זיהה כוונה ב־regex ואם התאים, כפה תשובת תבנית קבועה גם כש־Groq כבר ענה נכון וגמיש יותר מתוך הנתונים
- **בקוד:** הוסר `preferLocal: true` מכל ענפי ה"הצלחה" (allowSensitive===true) של savings_summary / investments_summary / overview_summary / salary_history / transactions_list / cashflow / balance ב־`getMockChatReply`; נשאר רק על transfers_help שלא תלוי בעובדות רגישות; `BANK_SYSTEM_PROMPT` קיבל הנחיה מפורשת לחשב/לסנן/להשוות מתוך העובדות ולהתאים תשובה לכל ניסוח
- **באתר:** בצ׳אט (מצב רגיש, עם Groq מוגדר) — שאלות בכל ניסוח על יתרה/תנועות/חסכונות/השקעות/ריכוז/משכורת/תזרים מקבלות תשובה מהמודל לפי הנתונים האמיתיים, במקום משפט קבוע מראש

### הפיכה לאפליקציה ניתנת להתקנה בטלפון (PWA) + חיבור פריסה חיה ל־Supabase
- **מה השתנה:** נוסף manifest.webmanifest + אייקונים (192/512/maskable/apple-touch-icon, נגזרים מ־logo.svg) ותגי meta להתקנה למסך הבית בכל 16 דפי ה־HTML; workflow הפריסה (GitHub Pages) מעביר עכשיו VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_CHAT_API_URL / VITE_INVEST_CHAT_API_URL כ־secrets לשלב הבנייה
- **קבצים:** public/manifest.webmanifest (חדש), public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png, public/apple-touch-icon.png (חדשים), כל 16 קבצי *.html (תגי `<link rel="manifest">`/`<meta theme-color>` וכו'), .github/workflows/deploy-pages.yml
- **למה:** המשתמש ביקש לשלוח קישור לחברים בוואטסאפ ושהם יוכלו "לפתוח כמו אפליקציה" בטלפון — כולל התחברות אמיתית של כל חבר בנפרד דרך Supabase באתר הפרוס (לא רק מקומית)
- **בקוד:** אין שינוי לוגיקת אפליקציה — רק manifest/meta/secrets בשלב הבנייה; ה־anon key של Supabase מיועד לחשיפה בצד לקוח (מוגן ב־RLS), נשמר כ־GitHub secret בכל זאת כנוהג סטנדרטי
- **באתר:** פתיחת https://buv100.github.io/ha-bank-shelanu/ בטלפון ובחירת "הוסף למסך הבית" פותחת את הדמו במסך מלא עם אייקון משלו; הרשמה/כניסה בפריסה החיה עובדת מול אותו Supabase כמו מקומית
