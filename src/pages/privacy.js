/**
 * מדיניות פרטיות לדמו —
 * מתארת מה קורה היום (מקומי) ומה ישתנה בעתיד (API / שרת).
 */

import { wrapInLegalShell } from '../ui/legalShell.js';
import { ACCESSIBILITY_PAGE, LOGIN_PAGE, TERMS_PAGE } from '../ui/navigation.js';

/**
 * בונה את תוכן מדיניות הפרטיות.
 * @returns {string}
 */
function getPrivacyContentMarkup() {
  return `
    <article class="legal-doc">
      <h2 class="legal-doc__title">מדיניות פרטיות</h2>
      <p class="legal-doc__meta">עודכן לאחרונה: 3 באוגוסט 2026</p>

      <p>
        מדיניות זו חלה על אתר הדמו <strong>הבנק שלנו</strong>.
        האתר אינו בנק ואינו אוסף כרגע מידע לשרת אמיתי.
      </p>

      <h3>איזה מידע קיים בדמו</h3>
      <ul>
        <li>נתוני חשבון, כרטיסים ופרופיל הם <strong>נתוני דמה</strong> בקוד — לא של משתמש אמיתי</li>
        <li>העדפות תצוגה (למשל הסתרת יתרה, מצב כהה) נשמרות ב־<strong>sessionStorage</strong> בדפדפן שלכם בלבד</li>
        <li>טופס ההתחברות וטופס ההלוואה הם למראה בלבד — הפרטים לא נשלחים לשרת כרגע</li>
      </ul>

      <h3>עוגיות ומעקב</h3>
      <p>
        כרגע האתר אינו משתמש ב־Google Analytics, בפיקסלים שיווקיים או בעוגיות מעקב של צד שלישי.
        אם בעתיד יתווספו כלי מדידה או צ׳אט AI חיצוני — נעדכן מדיניות זו ונוסיף מנגנון הסכמה מתאים.
      </p>

      <h3>אבטחה</h3>
      <p>
        אין להזין סיסמאות או פרטי בנק אמיתיים. בעלייה לאינטרנט יידרש HTTPS.
        מפתחות API (למשל לצ׳אט AI) לא יוחזקו בקוד חשוף בדפדפן.
      </p>

      <h3>זכויותיכם</h3>
      <p>
        מכיוון שאין מאגר מידע בשרת בדמו הנוכחי, אין כרגע תהליך עיון/מחיקה בשרת.
        ניתן למחוק נתונים מקומיים ע״י ניקוי נתוני האתר בדפדפן.
      </p>

      <h3>יצירת קשר</h3>
      <p>
        שאלות על פרטיות בדמו:
        <a href="mailto:demo-privacy@example.com">demo-privacy@example.com</a>
      </p>

      <h3>מסמכים נוספים</h3>
      <p>
        <a href="${ACCESSIBILITY_PAGE}">הצהרת נגישות</a>
        ·
        <a href="${TERMS_PAGE}">תנאי שימוש</a>
      </p>
    </article>
  `;
}

/**
 * בונה את דף מדיניות הפרטיות.
 * @returns {string}
 */
export function getPrivacyMarkup() {
  return wrapInLegalShell({
    title: 'מדיניות פרטיות',
    backHref: LOGIN_PAGE,
    backLabel: 'חזרה להתחברות',
    content: getPrivacyContentMarkup(),
  });
}
