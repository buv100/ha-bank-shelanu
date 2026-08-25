/**
 * סיכום השקעות — שווי, רווח יומי ורווח מקנייה.
 */

import { getCurrentUserId } from './session.js';
import {
  ensureInvestmentsData,
  listHoldings,
} from './investmentStore.js';

/**
 * @typedef {{
 *   id: string,
 *   symbol: string,
 *   name: string,
 *   type: string,
 *   value: number,
 *   costBasis: number,
 *   dailyChangePercent: number,
 *   dailyChangeAmount: number,
 *   purchaseProfit: number,
 *   purchaseProfitPercent: number,
 *   weightPercent: number
 * }} InvestmentHoldingView
 *
 * @typedef {{
 *   totalValue: number,
 *   totalCostBasis: number,
 *   dailyChangePercent: number,
 *   dailyChangeAmount: number,
 *   purchaseProfit: number,
 *   purchaseProfitPercent: number,
 *   holdings: InvestmentHoldingView[]
 * }} InvestmentsSummary
 */

/**
 * @param {import('./investmentStore.js').StoredHolding[]} holdings
 * @returns {InvestmentsSummary}
 */
function summarizeHoldings(holdings) {
  const totalValue = Number(
    holdings.reduce((sum, item) => sum + (Number(item.value) || 0), 0).toFixed(2),
  );
  const totalCostBasis = Number(
    holdings.reduce((sum, item) => sum + (Number(item.costBasis) || 0), 0).toFixed(2),
  );

  const dailyChangeAmount = Number(
    holdings
      .reduce((sum, item) => {
        const value = Number(item.value) || 0;
        const pct = Number(item.dailyChangePercent) || 0;
        return sum + (value * pct) / 100;
      }, 0)
      .toFixed(2),
  );

  const dailyChangePercent =
    totalValue > 0
      ? Number(((dailyChangeAmount / totalValue) * 100).toFixed(2))
      : 0;

  const purchaseProfit = Number((totalValue - totalCostBasis).toFixed(2));
  const purchaseProfitPercent =
    totalCostBasis > 0
      ? Number(((purchaseProfit / totalCostBasis) * 100).toFixed(2))
      : 0;

  const views = holdings.map((item) => {
    const value = Number(item.value) || 0;
    const costBasis = Number(item.costBasis) || 0;
    const pct = Number(item.dailyChangePercent) || 0;
    const purchaseProfitItem = Number((value - costBasis).toFixed(2));
    const purchaseProfitPercentItem =
      costBasis > 0
        ? Number(((purchaseProfitItem / costBasis) * 100).toFixed(2))
        : 0;

    return {
      id: item.id,
      symbol: item.symbol || item.name.slice(0, 4).toUpperCase(),
      name: item.name,
      type: item.type,
      value,
      costBasis,
      dailyChangePercent: pct,
      dailyChangeAmount: Number(((value * pct) / 100).toFixed(2)),
      purchaseProfit: purchaseProfitItem,
      purchaseProfitPercent: purchaseProfitPercentItem,
      weightPercent:
        totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0,
    };
  });

  return {
    totalValue,
    totalCostBasis,
    dailyChangePercent,
    dailyChangeAmount,
    purchaseProfit,
    purchaseProfitPercent,
    holdings: views,
  };
}

/**
 * @param {string | null} [userId]
 * @returns {InvestmentsSummary | null}
 */
export function getInvestmentsSummary(userId = getCurrentUserId()) {
  if (!userId) {
    return null;
  }

  ensureInvestmentsData(userId);
  const holdings = listHoldings(userId);

  if (!holdings.length) {
    return {
      totalValue: 0,
      totalCostBasis: 0,
      dailyChangePercent: 0,
      dailyChangeAmount: 0,
      purchaseProfit: 0,
      purchaseProfitPercent: 0,
      holdings: [],
    };
  }

  return summarizeHoldings(holdings);
}
