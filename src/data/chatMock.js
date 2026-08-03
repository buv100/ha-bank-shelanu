/**
 * תשובות דמה מקומיות לצ׳אט —
 * משמשות כשאין Worker/API או כשיש שגיאה.
 */

import { mockAccount } from './mockAccount.js';
import { mockCards } from './mockCards.js';
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

  if (intent === 'help') {
    return {
      reply: 'אפשר לשאול על יתרה (עם אישור), כרטיסים, או מעבר לדף. בלי ייעוץ פיננסי.',
    };
  }

  if (intent === 'navigate_loan') {
    return {
      reply: 'מעביר להלוואה.',
      action: 'navigate_loan',
    };
  }

  if (intent === 'navigate_profile') {
    return {
      reply: 'פותח פרופיל.',
      action: 'navigate_profile',
    };
  }

  if (intent === 'navigate_account') {
    return {
      reply: 'עוברים לעו״ש.',
      action: 'navigate_account',
    };
  }

  if (intent === 'balance') {
    if (!allowSensitive) {
      return {
        reply: 'צריך אישור להצגת יתרה — לחץ/י "מאשר/ת" למטה.',
        needsSensitiveConsent: true,
      };
    }

    return {
      reply: `יתרה בדמו: ${formatCurrency(mockAccount.balance)}.`,
    };
  }

  if (intent === 'cards') {
    const wantsNavigate = /עבור|פתח|לדף|go\s*to|open/.test(userText.toLowerCase());

    if (/מלא|full|cvv|מספר\s*מלא/.test(userText.toLowerCase()) && !allowSensitive) {
      return {
        reply: 'פרטים מלאים דורשים אישור — לחץ/י "מאשר/ת" למטה.',
        needsSensitiveConsent: true,
      };
    }

    if (!allowSensitive) {
      const masked = mockCards.map((c) => `${c.productName}: ${c.numberMasked}`).join(' · ');
      return {
        reply: `כרטיסים (ממוסך): ${masked}`,
        action: wantsNavigate ? 'navigate_cards' : undefined,
      };
    }

    const full = mockCards
      .map((c) => `${c.productName}: ${c.fullNumber}, ${c.expiry}, CVV ${c.cvv}`)
      .join(' · ');
    return {
      reply: full,
      action: wantsNavigate ? 'navigate_cards' : undefined,
    };
  }

  return {
    reply: 'שאלו בקצרה: יתרה, כרטיסים, או "עבור להלוואה".',
  };
}
