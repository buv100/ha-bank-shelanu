/**
 * הצהרת נגישות — בסיס מוכן לעלייה עתידית לאינטרנט.
 * יש לעדכן תאריך ובדיקות כשמשפרים נגישות בפועל.
 */

import { wrapInLegalShell } from '../ui/legalShell.js';
import { LOGIN_PAGE, PRIVACY_PAGE, TERMS_PAGE } from '../ui/navigation.js';

/**
 * בונה את תוכן הצהרת הנגישות.
 * @returns {string}
 */
function getAccessibilityContentMarkup() {
  return `
    <article class="legal-doc">
      <h2 class="legal-doc__title">הצהרת נגישות</h2>
      <p class="legal-doc__meta">עודכן לאחרונה: 3 באוגוסט 2026</p>

      <p>
        אתר <strong>הבנק שלנו</strong> הוא דמו לימודי בלבד. אנו שואפים לאפשר שימוש נוח גם לאנשים עם מוגבלות,
        ופועלים להתאמות בהתאם לעקרונות תקן ישראלי 5568 / WCAG ברמת AA ככל שהדמו מאפשר.
      </p>

      <h3>מה כבר קיים באתר</h3>
      <ul>
        <li>ממשק בעברית ובכיוון RTL</li>
        <li>קישור "דלג לתוכן הראשי"</li>
        <li>תוויות לשדות בטפסים</li>
        <li>באנר דמו ברור שאינו מסתמך על צבע בלבד</li>
        <li>תמיכה במצב כהה/בהיר</li>
      </ul>

      <h3>מגבלות ידועות (דמו)</h3>
      <ul>
        <li>האתר עדיין בתהליך שיפור נגישות — ייתכנו רכיבים שדורשים שיפור נוסף</li>
        <li>אין עדיין תוסף נגישות ייעודי או ביקורת נגישות מלאה על ידי מומחה</li>
        <li>חלק מהאנימציות וההיפוכים הוויזואליים (למשל כרטיס) עשויים להיות פחות נוחים לחלק מהמשתמשים</li>
      </ul>

      <h3>יצירת קשר בנושא נגישות</h3>
      <p>
        לפניות על בעיות נגישות בדמו זה (למידה בלבד), ניתן לפנות לכתובת הדמו:
        <a href="mailto:demo-accessibility@example.com">demo-accessibility@example.com</a>
      </p>
      <p>
        לפני עלייה ציבורית לאינטרנט מומלץ לעדכן כאן פרטי רכז נגישות אמיתיים ולבצע בדיקת התאמה מלאה לתקן.
      </p>

      <h3>מסמכים נוספים</h3>
      <p>
        <a href="${PRIVACY_PAGE}">מדיניות פרטיות</a>
        ·
        <a href="${TERMS_PAGE}">תנאי שימוש</a>
      </p>
    </article>
  `;
}

/**
 * בונה את דף הצהרת הנגישות.
 * @returns {string}
 */
export function getAccessibilityMarkup() {
  return wrapInLegalShell({
    title: 'הצהרת נגישות',
    backHref: LOGIN_PAGE,
    backLabel: 'חזרה להתחברות',
    content: getAccessibilityContentMarkup(),
  });
}
