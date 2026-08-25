/**
 * שומר פתיחת חשבון ל־Supabase + localStorage.
 */

import { MARKET_INSTRUMENTS } from '../data/mockMarket.js';
import { saveAccountData } from '../utils/accountStore.js';
import { saveCardsData } from '../utils/cardStore.js';
import { saveInvestmentsData } from '../utils/investmentStore.js';
import { getCurrentUser, writeLiveUser } from '../utils/session.js';
import { buildOnboardingSnapshot } from './bootstrapAccount.js';
import { saveRecurringExpenses } from './recurringExpenses.js';
import { getSupabase } from './supabaseClient.js';

const SETUP_FLAG_PREFIX = 'ha-bank-setup:';

/**
 * @param {string} userId
 * @returns {string}
 */
export function setupFlagKey(userId) {
  return `${SETUP_FLAG_PREFIX}${userId}`;
}

/**
 * @param {string} userId
 */
export function markSetupCompleteLocal(userId) {
  window.localStorage.setItem(setupFlagKey(userId), '1');
}

/**
 * @param {string} userId
 * @returns {boolean}
 */
export function isSetupCompleteLocal(userId) {
  return window.localStorage.getItem(setupFlagKey(userId)) === '1';
}

/**
 * @returns {Promise<Array<{ id: string, name: string, code: string }>>}
 */
export async function loadBranches() {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from('branches').select('id, name, code').order('name');

  if (error) {
    console.warn('[onboarding] branches', error.message);
    return [];
  }

  return data || [];
}

/**
 * @param {{
 *   phone: string,
 *   idNumber: string,
 *   address: string,
 *   monthlySalary: number,
 *   cards: Array<{ productId: string, creditLimit?: number }>,
 *   expenses: Array<{ description: string, amount: number, category: string }>,
 *   investments: Array<{ symbol: string, value: number }>,
 * }} form
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function submitOnboarding(form) {
  const user = getCurrentUser();
  const supabase = getSupabase();

  if (!user?.id) {
    return { ok: false, error: 'אין משתמש מחובר' };
  }

  const userId = user.id;
  const branches = await loadBranches();
  const investments = (form.investments || [])
    .filter((row) => row?.symbol && Number(row.value) > 0)
    .map((row) => {
      const market = MARKET_INSTRUMENTS.find((item) => item.symbol === row.symbol);
      return {
        symbol: row.symbol,
        name: market?.name || row.symbol,
        type: market?.type || 'קרן סל',
        value: Number(row.value),
        dailyChangePercent: market?.dailyChangePercent || 0,
      };
    });

  const snapshot = buildOnboardingSnapshot({
    fullName: user.profile?.fullName || '',
    phone: form.phone,
    idNumber: form.idNumber,
    address: form.address,
    monthlySalary: form.monthlySalary,
    cards: form.cards,
    expenses: form.expenses,
    investments,
    branches,
  });

  saveAccountData(userId, {
    accountId: user.account?.id || '',
    type: user.account?.type || 'checking',
    currency: user.account?.currency || 'ILS',
    balance: snapshot.balance,
    transactions: snapshot.transactions,
  });

  saveCardsData(userId, {
    cards: snapshot.cards.map((card) => ({
      id: card.id,
      type: card.type,
      creditLimit: card.creditLimit,
      debt: 0,
      blocked: false,
      lastFour: card.lastFour,
      transactions: [],
    })),
  });

  saveInvestmentsData(userId, {
    holdings: snapshot.holdings,
    watchlist: [],
  });

  saveRecurringExpenses(userId, snapshot.recurring);
  markSetupCompleteLocal(userId);

  writeLiveUser({
    ...user,
    setupCompleted: true,
    monthlySalary: snapshot.monthlySalary,
    profile: {
      ...user.profile,
      phone: snapshot.phone,
      idNumberMasked: snapshot.idNumberMasked,
      address: snapshot.address,
      branchName: snapshot.branch?.name || user.profile?.branchName || '',
      branchCode: snapshot.branch?.code || user.profile?.branchCode || '',
    },
    account: {
      ...user.account,
      balance: snapshot.balance,
    },
    transactions: snapshot.transactions,
    cards: snapshot.cards,
  });

  if (!supabase) {
    return { ok: true };
  }

  const { data: accountRow, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'checking')
    .maybeSingle();

  if (accountError || !accountRow) {
    console.warn('[onboarding] account', accountError?.message);
    return { ok: true };
  }

  const profilePatch = {
    phone: snapshot.phone,
    id_number_masked: snapshot.idNumberMasked,
    address: snapshot.address,
    monthly_salary: snapshot.monthlySalary,
  };

  if (snapshot.branch?.id) {
    profilePatch.branch_id = snapshot.branch.id;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profilePatch)
    .eq('id', userId);

  if (profileError) {
    console.warn('[onboarding] profile', profileError.message);
  }

  const { error: accountUpdateError } = await supabase
    .from('accounts')
    .update({ balance: snapshot.balance })
    .eq('id', accountRow.id);

  if (accountUpdateError) {
    console.warn('[onboarding] balance', accountUpdateError.message);
  }

  const { error: txError } = await supabase.from('transactions').insert(
    snapshot.transactions.map((tx) => ({
      id: tx.id,
      account_id: accountRow.id,
      posted_on: tx.date,
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      source: tx.description === 'משכורת' ? 'salary' : 'manual',
    })),
  );

  if (txError) {
    console.warn('[onboarding] transactions', txError.message);
  }

  const { error: cardsError } = await supabase.from('cards').insert(
    snapshot.cards.map((card) => ({
      id: card.id,
      user_id: userId,
      account_id: accountRow.id,
      type: card.type,
      variant: card.variant || null,
      product_name: card.productName,
      brand_name: card.brandName,
      holder_name: card.holderName,
      last_four: card.lastFour,
      expiry_month: card.expiryMonth,
      expiry_year: card.expiryYear,
      network: card.network,
      credit_limit: card.creditLimit,
      debt: 0,
      blocked: false,
      status: 'active',
    })),
  );

  if (cardsError) {
    console.warn('[onboarding] cards', cardsError.message);
  }

  const { data: instruments } = await supabase
    .from('market_instruments')
    .select('id, symbol');

  const bySymbol = new Map((instruments || []).map((row) => [row.symbol, row.id]));

  const holdingRows = snapshot.holdings
    .map((holding) => {
      const instrumentId = bySymbol.get(holding.symbol);

      if (!instrumentId) {
        return null;
      }

      return {
        id: holding.id,
        user_id: userId,
        instrument_id: instrumentId,
        value: holding.value,
        cost_basis: holding.costBasis,
        daily_change_percent: holding.dailyChangePercent,
      };
    })
    .filter(Boolean);

  if (holdingRows.length) {
    const { error: holdingsError } = await supabase.from('holdings').insert(holdingRows);

    if (holdingsError) {
      console.warn('[onboarding] holdings', holdingsError.message);
    }
  }

  const { error: recError } = await supabase.from('recurring_expenses').insert(
    snapshot.recurring.map((row) => ({
      id: row.id,
      user_id: userId,
      description: row.description,
      amount: row.amount,
      category: row.category,
      day_of_month: row.dayOfMonth,
    })),
  );

  if (recError) {
    console.warn('[onboarding] recurring', recError.message);
  }

  const { error: prefsError } = await supabase
    .from('user_prefs')
    .update({ setup_completed: true })
    .eq('user_id', userId);

  if (prefsError) {
    console.warn('[onboarding] prefs', prefsError.message);
  }

  return { ok: true };
}
