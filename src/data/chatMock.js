/**
 * תשובות דמה מקומיות לצ׳אט —
 * משמשות כשאין Worker/API או כשיש שגיאה.
 */

import { mockAccount } from './mockAccount.js';
import { mockCards } from './mockCards.js';
import { mockProfile } from './mockProfile.js';
import { formatCurrency } from '../utils/format.js';

/**
 * מזהה כוונה בסיסית מטקסט המשתמש.
 * @param {string} text
 * @returns {'navigate_account' | 'navigate_cards' | 'navigate_profile' | 'navigate_loan' | 'balance' | 'cards' | 'help' | 'general'}
 */
export function detectChatIntent(text) {
  const t = text.toLowerCase();

  if (/הלווא|loan/.test(t)) {
    return 'navigate_loan';
  }
  if (/כרטיס|card/.test(t)) {
    return 'cards';
  }
  if (/פרופיל|profile|פרטי\s*קשר/.test(t)) {
    return 'navigate_profile';
  }
  if (/יתר|balance|כמה\s*יש/.test(t)) {
    return 'balance';
  }
  if (/עו.?ש|חשבון|תנוע|account|transaction/.test(t)) {
    return 'navigate_account';
  }
  if (/עזר|help|מה\s*אתה|יכול/.test(t)) {
    return 'help';
  }

  return 'general';
}

/**
 * בונה תשובת דמה לפי כוונה והאם אושרו נתונים רגישים.
 * @param {string} userText
 * @param {{ allowSensitive: boolean }} options
 * @returns {{ reply: string, action?: string, needsSensitiveConsent?: boolean }}
 */
export function getMockChatReply(userText, options) {
  const intent = detectChatIntent(userText);
  const allowSensitive = Boolean(options.allowSensitive);
  const firstName = mockProfile.fullName.split(' ')[0];

  if (intent === 'help') {
    return {
      reply:
        `אני ${`הבנקאי של ${mockProfile.fullName}`} — עוזר דמו.\n` +
        'אפשר לשאול על יתרה (אחרי אישור), כרטיסים, מעבר לעו״ש/פרופיל/הלוואה.\n' +
        'אני לא נותן ייעוץ פיננסי — רק מידע ופעולות בדמו.',
    };
  }

  if (intent === 'navigate_loan') {
    return {
      reply: 'מעביר אותך לדף בקשת ההלוואה (דמו).',
      action: 'navigate_loan',
    };
  }

  if (intent === 'navigate_profile') {
    return {
      reply: 'פותח את דף הפרופיל.',
      action: 'navigate_profile',
    };
  }

  if (intent === 'navigate_account') {
    return {
      reply: 'חוזרים לדף העו״ש.',
      action: 'navigate_account',
    };
  }

  if (intent === 'balance') {
    if (!allowSensitive) {
      return {
        reply:
          'כדי להציג יתרה או פרטים כספיים צריך אישור שלך. לחץ/י "מאשר/ת הצגת פרטים רגישים" למטה.',
        needsSensitiveConsent: true,
      };
    }

    return {
      reply: `${firstName}, היתרה הזמינה בדמו היא ${formatCurrency(mockAccount.balance)}.`,
    };
  }

  if (intent === 'cards') {
    const wantsNavigate = /עבור|פתח|לדף|go\s*to|open/.test(userText.toLowerCase());

    if (/מלא|full|cvv|מספר\s*מלא/.test(userText.toLowerCase()) && !allowSensitive) {
      return {
        reply: 'פרטי כרטיס מלאים הם רגישים. אשר/י הצגת פרטים רגישים ואז שאל/י שוב.',
        needsSensitiveConsent: true,
      };
    }

    if (!allowSensitive) {
      const masked = mockCards.map((c) => `${c.productName}: ${c.numberMasked}`).join('\n');
      return {
        reply:
          `הכרטיסים בדמו (ממוסך):\n${masked}\n\n` +
          'לפרטים מלאים — אשר/י פרטים רגישים. למעבר לדף: "עבור לכרטיסים".',
        action: wantsNavigate ? 'navigate_cards' : undefined,
      };
    }

    const full = mockCards
      .map((c) => `${c.productName}: ${c.fullNumber} · תוקף ${c.expiry} · CVV ${c.cvv}`)
      .join('\n');
    return {
      reply: `פרטי כרטיסים (דמו, אחרי אישור):\n${full}`,
      action: wantsNavigate ? 'navigate_cards' : undefined,
    };
  }

  return {
    reply:
      'אני כאן לעזור בדמו: יתרה (עם אישור), כרטיסים, מעבר בין דפים והלוואה.\n' +
      'לא אוכל לתת ייעוץ או לשוחח בצ׳אט חופשי מחוץ לנושאי הבנק בדמו.\n' +
      'נסי/י למשל: "מה היתרה?", "כרטיסים", "עבור להלוואה".',
  };
}
