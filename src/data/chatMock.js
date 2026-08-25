/**
 * תשובות דמה מקומיות לצ׳אט —
 * משמשות כשאין Worker/API או כשיש שגיאה.
 */

import {
  getCurrentAccount,
  getCurrentCards,
  getCurrentTransactions,
  getCurrentUserId,
} from '../utils/session.js';
import { formatCurrency, formatDate, formatSignedPercent } from '../utils/format.js';
import {
  getCashflowSummary,
  TRANSFER_OPTIONS_CATALOG,
} from '../utils/chatAccountFacts.js';
import { getBalancesSummary } from '../utils/balances.js';
import { getInvestmentsSummary } from '../utils/investments.js';
import { listSalaryTransactions } from '../services/salaryDeposit.js';
import {
  ensureSavingsData,
  getTotalSavingsBalance,
} from '../utils/savingsStore.js';

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
  if (
    /הצג.*פרטי.*כרטיס|מה\s*פרטי\s*(ה)?כרטיס|פרטי\s*(ה)?כרטיס|פרטים\s*מלאים|reveal|הראה\s*cvv|מספר\s*מלא/.test(
      t,
    )
  ) {
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
  if (
    /חסכונ|חיסכון|פיקדון|savings/.test(t)
  ) {
    const asksAmount =
      /כמה|כסף|רשום|שווי|יתר|ריבית|יש\s*לי|סה.?כ|פירוט/.test(t);
    const wantsNavigate = /עבור|העבר\s*(אותי)?\s*ל|פתח|go\s*to|open|לדף/.test(t);

    if (asksAmount && !wantsNavigate) {
      return 'savings_summary';
    }

    return 'navigate_savings';
  }
  if (
    /העברות|דף\s*העבר|transfer|ביט|paybox|זה.?ב|swift|iban|תשלום\s*חשבונ|העברה\s*(למוטב|מהירה|בינלאומ|חוזרת)|איך\s*(אפשר\s*)?(להעביר|מעבירים)|מה\s*(ה)?אפשרויות.*העבר|סוגי\s*העבר/.test(
      t,
    )
  ) {
    const asksList =
      /מה|איך|אפשרו|סוג|רשימ|פירוט|יש|זמינ|כולל|אפשר/.test(t);
    const wantsNavigate = /עבור|העבר\s*(אותי)?\s*ל|פתח|go\s*to|open|לדף/.test(t);

    if (asksList && !wantsNavigate) {
      return 'transfers_help';
    }

    return 'navigate_transfers';
  }
  if (/השקע|invest/.test(t)) {
    const asksAmount =
      /כמה|כסף|רשום|שווי|אחוז|רווח|הפסד|תיק|יש\s*לי/.test(t);
    const wantsNavigate = /עבור|העבר|פתח|go\s*to|open|לדף/.test(t);

    if (asksAmount && !wantsNavigate) {
      return 'investments_summary';
    }

    return 'navigate_investments';
  }
  if (/ריכוז|overview|סיכום\s*(ה)?יתר/.test(t)) {
    const asksAmount =
      /כמה|כסף|רשום|נשאר|מה\s*(ה)?יתר|יש\s*לי|מה\s*מוצג|מה\s*כתוב|מה\s*מופיע|סכום/.test(
        t,
      );
    const correctsToOverview = /לא|אלא/.test(t);
    const wantsNavigate = /עבור|העבר|פתח|go\s*to|open/.test(t);

    if ((asksAmount || correctsToOverview) && !wantsNavigate) {
      return 'overview_summary';
    }

    return 'navigate_overview';
  }
  if (
    /מוציא.*מכניס|מכניס.*מוציא|הוצא.*הכנס|הכנס.*הוצא|תזרים|cash\s*flow|מצב\s*כלכלי|בסדר\s*מבחינת\s*כס|כמה\s*אני\s*מוציא|כמה\s*אני\s*מכניס/.test(
      t,
    )
  ) {
    return 'cashflow';
  }
  if (/משכורת|משכורות|salary/.test(t)) {
    return 'salary_history';
  }
  if (
    /תנוע|היסטורי.*חשבון|כל\s*(ה)?תנועות|רשימת\s*תנועות|transactions?/.test(t) &&
    !/כרטיס|card/.test(t)
  ) {
    return 'transactions_list';
  }
  if (/יתר|balance|כמה\s*יש/.test(t)) {
    return 'balance';
  }
  if (/עו.?ש|חשבון|account/.test(t)) {
    return 'navigate_account';
  }
  if (/עזר|help|מה\s*אתה\s*יכול|מה\s*תוכל/.test(t)) {
    return 'help';
  }
  if (
    /^(היי|הי|שלום|hello|hi|hey)[\s!?.]*$/i.test(text.trim()) ||
    /מה\s*קורה|מה\s*נשמע|מה\s*שלומ|בוקר\s*טוב|ערב\s*טוב|תודה|thanks|מה\s*עניינ/.test(t)
  ) {
    return 'smalltalk';
  }
  if (/מי\s*אתה|מה\s*אתה|ספר\s*על\s*עצמ/.test(t)) {
    return 'about_bot';
  }

  return 'general';
}

/**
 * תשובות שיחה פתוחות כש־Grok לא זמין.
 * @param {string} intent
 * @param {string} userText
 * @returns {string | null}
 */
function getConversationalFallback(intent, userText) {
  const t = userText.toLowerCase();

  if (intent === 'smalltalk') {
    if (/תודה|thanks/.test(t)) {
      return 'בשמחה. במה עוד אפשר לעזור?';
    }
    if (/בוקר\s*טוב/.test(t)) {
      return 'בוקר טוב! איך אפשר לעזור היום?';
    }
    if (/ערב\s*טוב/.test(t)) {
      return 'ערב טוב! רוצה לעבור על החשבון או פשוט לשאול משהו?';
    }
    return 'היי, הכל טוב פה. מה מעניין אותך — שיחה כללית, הסבר על הבנק, או מעבר לדף?';
  }

  if (intent === 'about_bot') {
    return 'אני הבנקאי של הדמו — אפשר לשאול על עו״ש, כרטיסים, חסכונות, העברות, השקעות, ריכוז והלוואה, או לבקש מעבר לדף. זה אתר למידה, לא בנק אמיתי.';
  }

  if (intent === 'general') {
    return 'אפשר לשאול על החשבון, חסכונות, העברות, כרטיסים, השקעות או סתם לדבר. אם תרצה פעולה: מעבר לדף, מצב כהה, או פרטי כרטיס במצב רגיש.';
  }

  return null;
}

/**
 * בונה רשימת בחירת כרטיסים לצ׳אט.
 * @param {object[]} cards
 * @returns {{ id: string, label: string, lastFour: string }[]}
 */
function getCardChoices(cards) {
  return cards.map((card) => ({
    id: card.id,
    label: card.productName,
    lastFour: card.lastFour,
  }));
}

/**
 * תשובה לבקשת פרטי כרטיס — בחירה בין כרטיסים (או כרטיס בודד).
 * @param {object[]} cards
 * @param {boolean} allowSensitive
 * @returns {{ reply: string, action?: string, needsSensitiveConsent?: boolean, cardChoices?: object[], cardId?: string }}
 */
function getRevealCardReply(cards, allowSensitive) {
  if (!allowSensitive) {
    return {
      reply: 'פרטי כרטיס זמינים רק במצב רגיש. אפשר לעבור עכשיו למטה.',
      needsSensitiveConsent: true,
      pendingCardReveal: true,
    };
  }

  if (cards.length === 0) {
    return { reply: 'אין כרטיסים למשתמש זה.' };
  }

  if (cards.length === 1) {
    return {
      reply: `פותח את פרטי ${cards[0].productName}…`,
      action: 'show_card_details',
      cardId: cards[0].id,
    };
  }

  return {
    reply: 'באיזה כרטיס תרצה/י לראות פרטים? לחץ/י לבחירה:',
    action: 'choose_card',
    cardChoices: getCardChoices(cards),
  };
}

/**
 * בונה תשובת דמה לפי כוונה והאם אושרו נתונים רגישים.
 * @param {string} userText
 * @param {{ allowSensitive: boolean }} options
 * @returns {{ reply: string, action?: string, needsSensitiveConsent?: boolean, cardChoices?: object[], cardId?: string }}
 */
export function getMockChatReply(userText, options) {
  const intent = detectChatIntent(userText);
  const allowSensitive = Boolean(options.allowSensitive);
  const account = getCurrentAccount();
  const cards = getCurrentCards();

  if (intent === 'help') {
    return {
      reply: allowSensitive
        ? 'אפשר לשאול על יתרה, תנועות, כרטיסים, חסכונות, העברות, השקעות וריכוז — או לבקש מעבר לדף / שינוי הגדרות. במה מתחילים?'
        : 'אפשר לדבר חופשי, לשאול על העברות/חסכונות ולעבור בין דפים. ליתרות ומספרים — עברו למצב רגיש. במה אפשר לעזור?',
    };
  }

  if (intent === 'smalltalk' || intent === 'about_bot') {
    return {
      reply: getConversationalFallback(intent, userText) || 'היי! במה אפשר לעזור?',
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
    return getRevealCardReply(cards, allowSensitive);
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

  if (intent === 'navigate_overview') {
    return {
      reply: 'מעביר לריכוז יתרות.',
      action: 'navigate_overview',
    };
  }

  if (intent === 'navigate_investments') {
    return {
      reply: 'מעביר להשקעות.',
      action: 'navigate_investments',
    };
  }

  if (intent === 'navigate_savings') {
    return {
      reply: 'מעביר לחסכונות.',
      action: 'navigate_savings',
    };
  }

  if (intent === 'navigate_transfers') {
    return {
      reply: 'מעביר להעברות.',
      action: 'navigate_transfers',
    };
  }

  if (intent === 'transfers_help') {
    const lines = TRANSFER_OPTIONS_CATALOG.map(
      (opt) => `• ${opt.title} — ${opt.desc}`,
    );

    return {
      reply: `בדף העברות יש ${TRANSFER_OPTIONS_CATALOG.length} אפשרויות (דמו בלבד):\n${lines.join('\n')}\nאפשר לבקש ממני «עבור להעברות».`,
      preferLocal: true,
    };
  }

  if (intent === 'savings_summary') {
    if (!allowSensitive) {
      return {
        reply: 'פרטי חסכונות זמינים רק במצב רגיש. אפשר לעבור עכשיו למטה.',
        needsSensitiveConsent: true,
      };
    }

    // מודל ה־AI מקבל את אותם נתונים דרך צילום החשבון ויכול לענות בדיוק — זו רק רשת ביטחון אם ה־API לא זמין
    const userId = getCurrentUserId();
    const data = userId ? ensureSavingsData(userId) : { accounts: [] };
    const accounts = data.accounts || [];

    if (accounts.length === 0) {
      return {
        reply: 'אין חסכונות למשתמש זה. אפשר לפתוח חיסכון בדף חסכונות.',
        action: 'navigate_savings',
      };
    }

    const total = getTotalSavingsBalance(accounts);
    const lines = accounts.map((item) => {
      const rate = `ריבית ${Number(item.interestRate).toFixed(1)}%`;
      const maturity = item.maturityDate ? `, פדיון ${item.maturityDate}` : '';
      return `• ${item.name}: ${formatCurrency(item.balance)} (${rate}${maturity})`;
    });

    return {
      reply: `סה״כ בחסכונות ${formatCurrency(total)}:\n${lines.join('\n')}`,
    };
  }

  if (intent === 'investments_summary') {
    if (!allowSensitive) {
      return {
        reply: 'פרטי השקעות זמינים רק במצב רגיש. אפשר לעבור עכשיו למטה.',
        needsSensitiveConsent: true,
      };
    }

    const invest = getInvestmentsSummary();

    if (!invest) {
      return {
        reply: 'אין תיק השקעות למשתמש זה בדמו.',
      };
    }

    return {
      reply: `שווי התיק ${formatCurrency(invest.totalValue)}, שינוי יומי ${formatSignedPercent(invest.dailyChangePercent)} (${formatCurrency(invest.dailyChangeAmount)}).`,
    };
  }

  if (intent === 'overview_summary') {
    if (!allowSensitive) {
      return {
        reply: 'מספרי דף הריכוז זמינים רק במצב רגיש. אפשר לעבור עכשיו למטה.',
        needsSensitiveConsent: true,
      };
    }

    const summary = getBalancesSummary();

    if (!summary) {
      return {
        reply: 'אין נתוני ריכוז כרגע — נסו להתחבר מחדש.',
      };
    }

    const investPart =
      summary.investments == null
        ? 'בלי תיק השקעות'
        : `השקעות ${formatCurrency(summary.investments)} (${formatSignedPercent(summary.investmentsDailyChangePercent || 0)} היום)`;

    return {
      reply: `בדף ריכוז המספר הראשי («כמה נשאר לך באמת») הוא ${formatCurrency(summary.netAvailable)} — עו״ש ${formatCurrency(summary.checkingBalance)} פחות אשראי ${formatCurrency(summary.creditDebt)}, פלוס חסכונות ${formatCurrency(summary.savingsTotal)} ועם ${investPart}.`,
      preferLocal: true,
    };
  }

  if (intent === 'navigate_account') {
    return {
      reply: 'עוברים לעו״ש.',
      action: 'navigate_account',
    };
  }

  if (intent === 'salary_history') {
    if (!allowSensitive) {
      return {
        reply: 'היסטוריית משכורות זמינה רק במצב רגיש. אפשר לעבור עכשיו למטה.',
        needsSensitiveConsent: true,
      };
    }

    const salaries = listSalaryTransactions(getCurrentUserId());

    if (salaries.length === 0) {
      return {
        reply: 'לא מצאתי הפקדות משכורת בחשבון בדמו.',
      };
    }

    const lines = salaries.map(
      (tx) => `• ${formatDate(tx.date)} — ${formatCurrency(tx.amount)}`,
    );
    const total = salaries.reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      reply: `היסטוריית המשכורות בחשבון (${salaries.length}):\n${lines.join('\n')}\nסה״כ: ${formatCurrency(total)}`,
    };
  }

  if (intent === 'transactions_list') {
    if (!allowSensitive) {
      return {
        reply: 'רשימת תנועות זמינה רק במצב רגיש. אפשר לעבור עכשיו למטה.',
        needsSensitiveConsent: true,
      };
    }

    const txs = getCurrentTransactions()
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 25);

    if (txs.length === 0) {
      return {
        reply: 'אין תנועות בחשבון כרגע.',
      };
    }

    const lines = txs.map(
      (tx) =>
        `• ${formatDate(tx.date)} — ${tx.description}: ${formatCurrency(tx.amount)}`,
    );

    return {
      reply: `תנועות אחרונות בעו״ש (${txs.length}):\n${lines.join('\n')}`,
    };
  }

  if (intent === 'cashflow') {
    if (!allowSensitive) {
      return {
        reply: 'סיכום הכנסות/הוצאות זמין רק במצב רגיש. אפשר לעבור עכשיו למטה.',
        needsSensitiveConsent: true,
      };
    }

    const cash = getCashflowSummary(getCurrentTransactions());
    const balance = Number(account?.balance) || 0;
    const balanceNote =
      balance >= 0
        ? `יתרת העו״ש ${formatCurrency(balance)}`
        : `יתרת העו״ש שלילית: ${formatCurrency(balance)}`;
    const compare =
      cash.net > 0
        ? 'ההכנסות גבוהות מההוצאות בתנועות שבדמו'
        : cash.net < 0
          ? 'ההוצאות גבוהות מההכנסות בתנועות שבדמו'
          : 'הכנסות והוצאות מאוזנות בתנועות שבדמו';

    return {
      reply: `${balanceNote}. הכנסות ${formatCurrency(cash.income)}, הוצאות ${formatCurrency(cash.expenses)} — ${compare}.`,
    };
  }

  if (intent === 'balance') {
    if (!allowSensitive) {
      return {
        reply: 'יתרה זמינה רק במצב רגיש. אפשר לעבור עכשיו למטה.',
        needsSensitiveConsent: true,
      };
    }

    return {
      reply: `יתרה בדמו: ${formatCurrency(account?.balance || 0)}.`,
    };
  }

  if (intent === 'cards') {
    const wantsNavigate = /עבור|פתח|לדף|go\s*to|open/.test(userText.toLowerCase());
    const wantsReveal = /הצג|פרט|מלא|cvv|reveal/.test(userText.toLowerCase());

    if (wantsReveal) {
      return getRevealCardReply(cards, allowSensitive);
    }

    if (wantsNavigate) {
      return {
        reply: 'מעביר לדף הכרטיסים.',
        action: 'navigate_cards',
      };
    }

    const masked = cards.map((c) => `${c.productName}: ${c.numberMasked}`).join(' · ');
    return {
      reply: masked ? `כרטיסים (ממוסך): ${masked}` : 'אין כרטיסים למשתמש זה.',
    };
  }

  return {
    reply:
      getConversationalFallback('general', userText) ||
      'אפשר לשאול אותי כמעט על הכל — או לבקש מעבר לדף / הגדרות.',
  };
}
