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
 * @returns {string}
 */
export function detectChatIntent(text) {
  const t = text.toLowerCase();

  if (/הסתר.*יתר|הסתרת\s*יתר|hide\s*balance/.test(t)) {
    return 'hide_balance';
  }
  if (/הצג.*יתר|בטל.*הסתר.*יתר|הראה\s*יתר|show\s*balance/.test(t)) {
    return 'show_balance';
  }
  if (/הסתר.*הלווא|הסתרת\s*פרסומת|hide\s*loan/.test(t)) {
    return 'hide_loan';
  }
  if (/הצג.*הלווא|הראה.*הלווא|בטל.*הסתר.*הלווא|show\s*loan/.test(t)) {
    return 'show_loan';
  }
  if (/כבה.*התרא|בטל.*התרא|notifications?\s*off/.test(t)) {
    return 'notifications_off';
  }
  if (/הפעל.*התרא|תדליק.*התרא|notifications?\s*on/.test(t)) {
    return 'notifications_on';
  }
  if (/מצב\s*כהה|dark\s*mode|theme\s*dark/.test(t)) {
    return 'theme_dark';
  }
  if (/מצב\s*בהיר|light\s*mode|theme\s*light/.test(t)) {
    return 'theme_light';
  }
  if (/פתח.*הגדר|הצג.*הגדר|open\s*settings|settings/.test(t)) {
    return 'open_settings';
  }
  if (/הצג.*פרטי.*כרטיס|פרטים\s*מלאים|reveal|הראה\s*cvv|מספר\s*מלא/.test(t)) {
    return 'reveal_card';
  }
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
      reply:
        'אפשר: יתרה, הצגת כרטיס, הסתרת יתרה/הלוואה, התראות, מצב כהה, מעבר לדף.',
    };
  }

  if (intent === 'hide_balance') {
    return { reply: 'מסתיר יתרה.', action: 'hide_balance' };
  }

  if (intent === 'show_balance') {
    return { reply: 'מציג יתרה.', action: 'show_balance' };
  }

  if (intent === 'hide_loan') {
    return { reply: 'מסתיר פרסומת הלוואה.', action: 'hide_loan' };
  }

  if (intent === 'show_loan') {
    return { reply: 'מציג פרסומת הלוואה.', action: 'show_loan' };
  }

  if (intent === 'notifications_on') {
    return { reply: 'התראות הופעלו (דמו).', action: 'notifications_on' };
  }

  if (intent === 'notifications_off') {
    return { reply: 'התראות כובו (דמו).', action: 'notifications_off' };
  }

  if (intent === 'theme_dark') {
    return { reply: 'עובר למצב כהה.', action: 'theme_dark' };
  }

  if (intent === 'theme_light') {
    return { reply: 'עובר למצב בהיר.', action: 'theme_light' };
  }

  if (intent === 'open_settings') {
    return { reply: 'פותח הגדרות.', action: 'open_settings' };
  }

  if (intent === 'reveal_card') {
    if (!allowSensitive) {
      return {
        reply: 'הצגת פרטי כרטיס מלאים דורשת אישור — לחץ/י "מאשר/ת" למטה.',
        needsSensitiveConsent: true,
      };
    }

    return {
      reply: 'פותח פרטי כרטיס מלאים.',
      action: 'reveal_card',
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
    const wantsReveal = /הצג|פרטים|מלא|cvv|reveal/.test(userText.toLowerCase());

    if (wantsReveal) {
      if (!allowSensitive) {
        return {
          reply: 'פרטים מלאים דורשים אישור — לחץ/י "מאשר/ת" למטה.',
          needsSensitiveConsent: true,
        };
      }

      return {
        reply: 'פותח פרטי כרטיס.',
        action: 'reveal_card',
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
    reply: 'נסו: "הצג פרטי כרטיס", "הסתר יתרה", "מצב כהה", "עבור להלוואה".',
  };
}
