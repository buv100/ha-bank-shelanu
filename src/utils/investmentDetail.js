/**
 * מציאת פרטי מכשיר/החזקה לדף פירוט.
 */

import {
  buildFallbackProfile,
  findMarketBySymbolOrName,
  findMarketInstrument,
  getInstrumentProfile,
} from '../data/mockMarket.js';
import { getInvestmentsSummary } from './investments.js';
import {
  ensureInvestmentsData,
  listHoldings,
} from './investmentStore.js';
import { getCurrentUserId } from './session.js';

/**
 * @typedef {{
 *   name: string,
 *   symbol: string,
 *   type: string,
 *   unitPrice: number | null,
 *   dailyChangePercent: number,
 *   marketId: string | null,
 *   holdingId: string | null,
 *   owned: boolean,
 *   value: number,
 *   costBasis: number,
 *   purchaseProfit: number,
 *   purchaseProfitPercent: number,
 *   weightPercent: number,
 *   unitsEstimate: number | null,
 *   description: string,
 *   risk: string,
 *   currency: string,
 *   exchange: string,
 *   expenseRatioPercent: number,
 *   ytdPercent: number,
 *   year1Percent: number,
 *   weekChangePercent: number[],
 *   tags: string[]
 * }} InvestmentDetailView
 */

/**
 * @param {{ holdingId?: string | null, marketId?: string | null }} query
 * @param {string | null} [userId]
 * @returns {InvestmentDetailView | null}
 */
export function resolveInvestmentDetail(query, userId = getCurrentUserId()) {
  const holdingId = query.holdingId || null;
  const marketId = query.marketId || null;

  if (userId) {
    ensureInvestmentsData(userId);
  }

  const holdings = userId ? listHoldings(userId) : [];
  const summary = getInvestmentsSummary(userId);
  const holding = holdingId
    ? holdings.find((item) => item.id === holdingId)
    : null;

  let market = marketId ? findMarketInstrument(marketId) : undefined;

  if (!market && holding) {
    market =
      findMarketBySymbolOrName(holding.symbol || '') ||
      findMarketBySymbolOrName(holding.name);
  }

  if (!market && !holding) {
    return null;
  }

  const profile = market
    ? getInstrumentProfile(market.id) ||
      buildFallbackProfile({
        name: market.name,
        type: market.type,
        dailyChangePercent: market.dailyChangePercent,
      })
    : buildFallbackProfile(holding);

  const holdingView = holding
    ? summary?.holdings.find((item) => item.id === holding.id)
    : market
      ? summary?.holdings.find(
          (item) =>
            item.symbol === market.symbol || item.name === market.name,
        )
      : null;

  const owned = Boolean(holdingView || holding);
  const value = Number(holdingView?.value ?? holding?.value ?? 0);
  const costBasis = Number(holdingView?.costBasis ?? holding?.costBasis ?? 0);
  const purchaseProfit = Number(
    holdingView?.purchaseProfit ?? Number((value - costBasis).toFixed(2)),
  );
  const purchaseProfitPercent = Number(
    holdingView?.purchaseProfitPercent ??
      (costBasis > 0
        ? Number(((purchaseProfit / costBasis) * 100).toFixed(2))
        : 0),
  );
  const weightPercent = Number(holdingView?.weightPercent ?? 0);
  const unitPrice = market ? market.unitPrice : null;
  const dailyChangePercent = Number(
    holdingView?.dailyChangePercent ??
      holding?.dailyChangePercent ??
      market?.dailyChangePercent ??
      0,
  );

  return {
    name: market?.name || holding?.name || '',
    symbol: market?.symbol || holding?.symbol || '',
    type: market?.type || holding?.type || '',
    unitPrice,
    dailyChangePercent,
    marketId: market?.id || null,
    holdingId: holdingView?.id || holding?.id || null,
    owned,
    value,
    costBasis,
    purchaseProfit,
    purchaseProfitPercent,
    weightPercent,
    unitsEstimate:
      unitPrice && unitPrice > 0 && value > 0
        ? Number((value / unitPrice).toFixed(4))
        : null,
    description: profile.description,
    risk: profile.risk,
    currency: profile.currency,
    exchange: profile.exchange,
    expenseRatioPercent: profile.expenseRatioPercent,
    ytdPercent: profile.ytdPercent,
    year1Percent: profile.year1Percent,
    weekChangePercent: profile.weekChangePercent,
    tags: profile.tags,
  };
}
