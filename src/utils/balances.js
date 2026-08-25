/**
 * חישוב ריכוז יתרות — עו״ש, חוב אשראי, השקעות, חסכונות, נטו.
 * מוכן להחלפת מקורות הנתונים ב־API/DB.
 */

import {
  getCurrentAccount,
  getCurrentCards,
  getCurrentUserId,
} from './session.js';
import { getInvestmentsSummary } from './investments.js';
import {
  ensureSavingsData,
  getTotalSavingsBalance,
} from './savingsStore.js';

/**
 * @typedef {{
 *   checkingBalance: number,
 *   creditDebt: number,
 *   investments: number | null,
 *   investmentsDailyChangePercent: number | null,
 *   investmentsDailyChangeAmount: number | null,
 *   investmentsPurchaseProfit: number | null,
 *   investmentsPurchaseProfitPercent: number | null,
 *   savingsTotal: number,
 *   savingsCount: number,
 *   netAvailable: number,
 *   creditCards: Array<{ id: string, productName: string, lastFour: string, debt: number, creditLimit: number, availableCredit: number }>
 * }} BalancesSummary
 */

/**
 * מחזיר סיכום יתרות למשתמש המחובר.
 * נטו = עו״ש − חוב אשראי + השקעות + חסכונות.
 * @returns {BalancesSummary | null}
 */
export function getBalancesSummary() {
  const account = getCurrentAccount();

  if (!account) {
    return null;
  }

  const creditCards = getCurrentCards()
    .filter((card) => card.type === 'credit')
    .map((card) => ({
      id: card.id,
      productName: card.productName,
      lastFour: card.lastFour,
      debt: Number(card.debt) || 0,
      creditLimit: Number(card.creditLimit) || 0,
      availableCredit: Number(card.availableCredit) || 0,
    }));

  const creditDebt = Number(
    creditCards.reduce((sum, card) => sum + card.debt, 0).toFixed(2),
  );

  const investmentsSummary = getInvestmentsSummary();
  const hasPortfolio = Boolean(investmentsSummary?.holdings?.length);
  const investments = hasPortfolio ? investmentsSummary.totalValue : null;
  const investmentsValue = investments ?? 0;
  const investmentsDailyChangePercent = hasPortfolio
    ? investmentsSummary.dailyChangePercent
    : null;
  const investmentsDailyChangeAmount = hasPortfolio
    ? investmentsSummary.dailyChangeAmount
    : null;
  const investmentsPurchaseProfit = hasPortfolio
    ? investmentsSummary.purchaseProfit
    : null;
  const investmentsPurchaseProfitPercent = hasPortfolio
    ? investmentsSummary.purchaseProfitPercent
    : null;

  const userId = getCurrentUserId();
  const savingsAccounts = userId ? ensureSavingsData(userId).accounts : [];
  const savingsTotal = Number(getTotalSavingsBalance(savingsAccounts).toFixed(2));
  const savingsCount = savingsAccounts.length;

  const checkingBalance = Number(account.balance) || 0;
  const netAvailable = Number(
    (checkingBalance - creditDebt + investmentsValue + savingsTotal).toFixed(2),
  );

  return {
    checkingBalance,
    creditDebt,
    investments,
    investmentsDailyChangePercent,
    investmentsDailyChangeAmount,
    investmentsPurchaseProfit,
    investmentsPurchaseProfitPercent,
    savingsTotal,
    savingsCount,
    netAvailable,
    creditCards,
  };
}
