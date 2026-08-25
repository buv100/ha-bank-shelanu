/**
 * טוען פרופיל/עו״ש/כרטיסים מ־Supabase ושומר ל־localStorage
 * באותו פורמט שה־stores הקיימים מצפים לו.
 */

import { saveAccountData } from '../utils/accountStore.js';
import { saveCardsData } from '../utils/cardStore.js';
import { saveInvestmentsData } from '../utils/investmentStore.js';
import { ensureCardDisplayFields } from './bootstrapAccount.js';
import { saveRecurringExpenses } from './recurringExpenses.js';
import { getSupabase } from './supabaseClient.js';

/**
 * @param {string} userId
 * @returns {Promise<object | null>}
 */
export async function hydrateUserFromSupabase(userId) {
  const supabase = getSupabase();

  if (!supabase || !userId) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, branches ( name, code )')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.warn('[supabase] profile', profileError?.message);
    return null;
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'checking')
    .maybeSingle();

  const { data: txRows } = account
    ? await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', account.id)
        .order('posted_on', { ascending: false })
    : { data: [] };

  const transactions = (txRows || []).map((row) => ({
    id: row.id,
    date: row.posted_on,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
  }));

  if (account) {
    saveAccountData(userId, {
      accountId: account.id,
      type: account.type,
      currency: account.currency,
      balance: Number(account.balance),
      transactions,
    });
  }

  const { data: cardRows } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId);

  const cardsMeta = [];
  const runtimeCards = [];

  for (const card of cardRows || []) {
    const { data: cardTx } = await supabase
      .from('card_transactions')
      .select('*')
      .eq('card_id', card.id)
      .order('posted_on', { ascending: false });

    const month = String(card.expiry_month).padStart(2, '0');
    const year = String(card.expiry_year).slice(-2);
    const blocked = Boolean(card.blocked);

    cardsMeta.push(ensureCardDisplayFields({
      id: card.id,
      brandName: card.brand_name,
      productName: card.product_name,
      type: card.type,
      variant: card.variant || undefined,
      holderName: card.holder_name,
      lastFour: card.last_four,
      numberMasked: `•••• •••• •••• ${card.last_four}`,
      expiry: `${month}/${year}`,
      network: card.network,
      status: blocked ? 'blocked' : card.status,
      statusLabel: blocked ? 'חסום' : 'פעיל',
    }));

    runtimeCards.push({
      id: card.id,
      type: card.type,
      creditLimit: Number(card.credit_limit) || 0,
      debt: Number(card.debt) || 0,
      blocked,
      lastFour: card.last_four,
      transactions: (cardTx || []).map((row) => ({
        id: row.id,
        date: row.posted_on,
        description: row.description,
        amount: Number(row.amount),
        category: row.category,
      })),
    });
  }

  saveCardsData(userId, { cards: runtimeCards });

  const { data: prefs } = await supabase
    .from('user_prefs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: holdingRows } = await supabase
    .from('holdings')
    .select('*, market_instruments ( symbol, name, type, daily_change_percent )')
    .eq('user_id', userId);

  saveInvestmentsData(userId, {
    holdings: (holdingRows || []).map((row) => {
      const instrument = row.market_instruments || {};
      return {
        id: row.id,
        symbol: instrument.symbol || '',
        name: instrument.name || '',
        type: instrument.type || '',
        value: Number(row.value) || 0,
        costBasis: Number(row.cost_basis) || 0,
        dailyChangePercent: Number(row.daily_change_percent) || Number(instrument.daily_change_percent) || 0,
      };
    }),
    watchlist: [],
  });

  const { data: recRows, error: recError } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', userId);

  if (!recError && Array.isArray(recRows)) {
    saveRecurringExpenses(
      userId,
      recRows.map((row) => ({
        id: row.id,
        description: row.description,
        amount: Number(row.amount) || 0,
        category: row.category || 'חשבונות',
        dayOfMonth: Number(row.day_of_month) || 5,
      })),
    );
  }

  const branch = profile.branches;

  return {
    id: userId,
    role: 'customer',
    source: 'supabase',
    setupCompleted: Boolean(prefs?.setup_completed),
    monthlySalary: Number(profile.monthly_salary) || 0,
    profile: {
      id: userId,
      fullName: profile.full_name,
      initials: profile.initials || profile.full_name.slice(0, 1),
      email: '',
      phone: profile.phone || '',
      idNumberMasked: profile.id_number_masked || '',
      address: profile.address || '',
      customerNumber: profile.customer_number,
      branchName: branch?.name || '',
      branchCode: branch?.code || '',
      accountStatus: profile.account_status,
      accountStatusLabel: profile.account_status === 'active' ? 'פעיל' : profile.account_status,
      username: profile.username,
    },
    account: {
      id: account?.id || '',
      type: account?.type || 'checking',
      currency: account?.currency || 'ILS',
      balance: Number(account?.balance) || 0,
    },
    transactions,
    cards: cardsMeta,
  };
}
