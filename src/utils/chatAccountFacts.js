/**
 * עובדות חשבון מלאות לצ׳אט —
 * נשלחות במצב רגיש ל־Groq כדי לענות לפי נתונים אמיתיים בלבד.
 * בלי מספר כרטיס מלא / CVV.
 */

import {
  getCurrentAccount,
  getCurrentCards,
  getCurrentProfile,
  getCurrentTransactions,
  getCurrentUser,
  getCurrentUserId,
} from './session.js';
import { getBalancesSummary } from './balances.js';
import { listSalaryTransactions } from '../services/salaryDeposit.js';
import {
  ensureSavingsData,
  getTotalSavingsBalance,
} from './savingsStore.js';

const MAX_CHECKING_TX = 50;
const MAX_CARD_TX = 20;

/** אפשרויות בדף העברות — לדמו ולצ׳אט (תואם לדף transfers). */
export const TRANSFER_OPTIONS_CATALOG = [
  { id: 'beneficiary', title: 'העברה למוטב', desc: 'לחשבון בנק בישראל' },
  { id: 'own', title: 'בין חשבונות שלי', desc: 'עו״ש, חיסכון, מט״ח' },
  { id: 'bit', title: 'ביט / PayBox', desc: 'לפי מספר נייד' },
  { id: 'fast', title: 'העברה מהירה', desc: 'זה״ב — באותו יום' },
  { id: 'international', title: 'העברה בינלאומית', desc: 'SWIFT / IBAN' },
  { id: 'bills', title: 'תשלום חשבונות', desc: 'חשמל, מים, ארנונה' },
  { id: 'savings', title: 'הפקדה לחיסכון', desc: 'מעו״ש לחיסכון (גם בדף חסכונות)' },
  { id: 'standing', title: 'העברה חוזרת', desc: 'הוראת קבע' },
];

/**
 * @typedef {{
 *   income: number,
 *   expenses: number,
 *   net: number,
 *   txCount: number
 * }} CashflowSummary
 */

/**
 * מסכם הכנסות מול הוצאות מתנועות העו״ש.
 * @param {Array<{ amount?: number }> | undefined} transactions
 * @returns {CashflowSummary}
 */
export function getCashflowSummary(transactions) {
  const list = Array.isArray(transactions)
    ? transactions
    : getCurrentTransactions();

  let income = 0;
  let expenses = 0;

  list.forEach((tx) => {
    const amount = Number(tx?.amount) || 0;

    if (amount > 0) {
      income += amount;
    } else if (amount < 0) {
      expenses += Math.abs(amount);
    }
  });

  return {
    income: Number(income.toFixed(2)),
    expenses: Number(expenses.toFixed(2)),
    net: Number((income - expenses).toFixed(2)),
    txCount: list.length,
  };
}

/**
 * ממיין תנועות מהחדשה לישנה וחותך.
 * @param {Array<{ date?: string }>} list
 * @param {number} limit
 * @returns {typeof list}
 */
function sortAndLimitTx(list, limit) {
  return list
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, limit);
}

/**
 * אובייקט עובדות מלא לשליחה ל־API (מצב רגיש בלבד).
 * @returns {object | null}
 */
export function buildChatAccountFacts() {
  const account = getCurrentAccount();

  if (!account) {
    return null;
  }

  const user = getCurrentUser();
  const profile = getCurrentProfile();
  const balances = getBalancesSummary();
  const allTx = getCurrentTransactions();
  const cash = getCashflowSummary(allTx);
  const salary = user?.monthlySalary;
  const salaryHistory = listSalaryTransactions(getCurrentUserId()).map((tx) => ({
    date: tx.date,
    amount: Number(tx.amount) || 0,
  }));

  const transactions = sortAndLimitTx(allTx, MAX_CHECKING_TX).map((tx) => ({
    date: tx.date,
    description: tx.description,
    amount: Number(tx.amount) || 0,
    category: tx.category || '',
  }));

  const cards = getCurrentCards().map((card) => ({
    id: card.id,
    productName: card.productName,
    type: card.type,
    lastFour: card.lastFour,
    numberMasked: card.numberMasked,
    holderName: card.holderName,
    status: card.statusLabel || card.status,
    expiry: card.expiry,
    debt: Number(card.debt) || 0,
    creditLimit: Number(card.creditLimit) || 0,
    availableCredit:
      card.availableCredit == null ? null : Number(card.availableCredit),
    recentTransactions: sortAndLimitTx(
      Array.isArray(card.cardTransactions) ? card.cardTransactions : [],
      MAX_CARD_TX,
    ).map((tx) => ({
      date: tx.date,
      description: tx.description,
      amount: Number(tx.amount) || 0,
      category: tx.category || '',
    })),
  }));

  const userId = getCurrentUserId();
  const savingsData = userId ? ensureSavingsData(userId) : { accounts: [] };
  const savingsAccounts = (savingsData.accounts || []).map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    balance: Number(item.balance) || 0,
    interestRate: Number(item.interestRate) || 0,
    openedAt: item.openedAt || '',
    maturityDate: item.maturityDate || null,
  }));
  const savingsTotal = getTotalSavingsBalance(savingsAccounts);

  return {
    customerName: profile?.fullName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    customerNumber: profile?.customerNumber || '',
    branchName: profile?.branchName || '',
    branchCode: profile?.branchCode || '',
    accountStatus: profile?.accountStatusLabel || profile?.accountStatus || '',
    accountId: account.id || '',
    accountType: account.type || 'checking',
    currency: account.currency || 'ILS',
    checkingBalance: Number(account.balance) || 0,
    creditDebt: balances?.creditDebt ?? 0,
    netAvailable: balances?.netAvailable ?? (Number(account.balance) || 0),
    investments: balances?.investments ?? null,
    investmentsDailyChangePercent:
      balances?.investmentsDailyChangePercent ?? null,
    savingsTotal: balances?.savingsTotal ?? 0,
    savingsAccounts,
    transferOptions: TRANSFER_OPTIONS_CATALOG,
    appPages: [
      'ריכוז',
      'עו״ש',
      'העברות',
      'חסכונות',
      'כרטיסים',
      'פרופיל',
      'השקעות',
      'הלוואה',
    ],
    incomeTotal: cash.income,
    expenseTotal: cash.expenses,
    cashflowNet: cash.net,
    monthlySalary: typeof salary === 'number' ? salary : null,
    transactionCount: cash.txCount,
    salaryHistory,
    transactions,
    cards,
  };
}

/**
 * טקסט עובדות מלא לפרומפט של המודל.
 * @param {ReturnType<typeof buildChatAccountFacts>} facts
 * @returns {string}
 */
export function formatAccountFactsForPrompt(facts) {
  if (!facts) {
    return '';
  }

  const lines = [
    '=== צילום חשבון בדמו (מקור אמת יחיד) ===',
    `לקוח: ${facts.customerName}`,
    `אימייל: ${facts.email}`,
    `טלפון: ${facts.phone}`,
    `כתובת: ${facts.address}`,
    `מספר לקוח: ${facts.customerNumber}`,
    `סניף: ${facts.branchName} (${facts.branchCode})`,
    `סטטוס חשבון: ${facts.accountStatus}`,
    `מזהה חשבון: ${facts.accountId} | סוג: ${facts.accountType} | מטבע: ${facts.currency}`,
    `יתרת עו״ש: ${facts.checkingBalance}`,
    `חוב אשראי כולל: ${facts.creditDebt}`,
    `מספר ראשי בדף ריכוז («כמה נשאר לך באמת» = עו״ש − אשראי + חסכונות + השקעות): ${facts.netAvailable}`,
    `השקעות: ${facts.investments == null ? 'אין תיק' : facts.investments}`,
    facts.investmentsDailyChangePercent != null
      ? `שינוי יומי בהשקעות (%): ${facts.investmentsDailyChangePercent}`
      : null,
    `סה״כ חסכונות: ${facts.savingsTotal ?? 0}`,
    `סך הכנסות בתנועות עו״ש: ${facts.incomeTotal}`,
    `סך הוצאות בתנועות עו״ש: ${facts.expenseTotal}`,
    `הפרש תזרים: ${facts.cashflowNet}`,
    `מספר תנועות עו״ש: ${facts.transactionCount}`,
  ].filter(Boolean);

  if (Array.isArray(facts.savingsAccounts) && facts.savingsAccounts.length) {
    lines.push(`חסכונות (${facts.savingsAccounts.length}):`);
    facts.savingsAccounts.forEach((item) => {
      const maturity = item.maturityDate ? ` | פדיון: ${item.maturityDate}` : '';
      lines.push(
        `  - ${item.name} (${item.type}) | יתרה: ${item.balance} | ריבית שנתית: ${item.interestRate}%${maturity}`,
      );
    });
  } else {
    lines.push('חסכונות: אין');
  }

  if (Array.isArray(facts.transferOptions) && facts.transferOptions.length) {
    lines.push('אפשרויות בדף העברות (דמו — לא מבצע העברה אמיתית):');
    facts.transferOptions.forEach((opt) => {
      lines.push(`  - ${opt.title}: ${opt.desc}`);
    });
  }

  if (Array.isArray(facts.appPages) && facts.appPages.length) {
    lines.push(`דפים באפליקציה: ${facts.appPages.join(' · ')}`);
  }

  if (facts.monthlySalary != null) {
    lines.push(`משכורת חודשית קבועה בדמו: ${facts.monthlySalary}`);
  }

  if (Array.isArray(facts.salaryHistory) && facts.salaryHistory.length) {
    lines.push(`היסטוריית משכורות (${facts.salaryHistory.length}):`);
    facts.salaryHistory.forEach((s) => {
      lines.push(`  - ${s.date}: ${s.amount}`);
    });
  } else {
    lines.push('היסטוריית משכורות: אין');
  }

  if (Array.isArray(facts.transactions) && facts.transactions.length) {
    lines.push(
      `תנועות עו״ש (עד ${facts.transactions.length}, מהחדשה לישנה):`,
    );
    facts.transactions.forEach((tx) => {
      lines.push(
        `  - ${tx.date} | ${tx.description} | ${tx.amount} | ${tx.category}`,
      );
    });
  } else {
    lines.push('תנועות עו״ש: אין');
  }

  if (Array.isArray(facts.cards) && facts.cards.length) {
    lines.push(`כרטיסים (${facts.cards.length}):`);
    facts.cards.forEach((card) => {
      lines.push(
        `  - ${card.productName} (${card.type}) •••• ${card.lastFour} | סטטוס: ${card.status} | תוקף: ${card.expiry} | חוב: ${card.debt} | מסגרת: ${card.creditLimit} | זמין: ${card.availableCredit ?? '—'}`,
      );

      if (card.recentTransactions?.length) {
        lines.push(`    תנועות כרטיס אחרונות:`);
        card.recentTransactions.forEach((tx) => {
          lines.push(
            `      - ${tx.date} | ${tx.description} | ${tx.amount} | ${tx.category}`,
          );
        });
      }
    });
  } else {
    lines.push('כרטיסים: אין');
  }

  lines.push(
    'הערות: אין בנתונים מספר כרטיס מלא או CVV. לפרטים מלאים של כרטיס — להפנות לפתיחת פרטי כרטיס באפליקציה.',
  );

  return lines.join('\n');
}
