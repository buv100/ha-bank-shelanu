/**
 * משלים נתונים חסרים אחרי שהמשתמש הזין פרטי פתיחה.
 * סניף, יתרה, מספרים על הכרטיס, וערכי ברירת מחדל לשדות ריקים.
 */

export const CARD_PRODUCTS = [
  { id: 'debit', type: 'debit', variant: '', productName: 'כרטיס חיוב', creditLimit: 0 },
  { id: 'credit', type: 'credit', variant: '', productName: 'כרטיס אשראי', creditLimit: 15000 },
  { id: 'gold', type: 'credit', variant: 'gold', productName: 'כרטיס זהב', creditLimit: 30000 },
  { id: 'travel', type: 'credit', variant: 'travel', productName: 'כרטיס נסיעות', creditLimit: 20000 },
  { id: 'digital', type: 'debit', variant: 'digital', productName: 'כרטיס דיגיטלי', creditLimit: 0 },
  { id: 'platinum', type: 'credit', variant: 'platinum', productName: 'כרטיס פלטינום', creditLimit: 50000 },
];

export const EXPENSE_CATEGORIES = ['חשבונות', 'דיור', 'ביטוח', 'תקשורת', 'חינוך', 'אחר'];

const DEMO_STREETS = [
  'רחוב הביכורים 8, תל אביב',
  'שדרות הנשיא 22, חיפה',
  'רחוב יפו 41, ירושלים',
  'העצמאות 15, באר שבע',
  'הרצל 9, רמת גן',
];

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomMoney(min, max) {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

/**
 * @returns {string}
 */
function randomLastFour() {
  return String(randomInt(1000, 9999));
}

/**
 * מספר כרטיס מלא לדמו (לא נשמר ב־DB — רק להצגה).
 * @param {string} lastFour
 * @returns {string}
 */
export function buildDemoFullNumber(lastFour) {
  const digits = String(lastFour || '').replace(/\D/g, '').padStart(4, '0').slice(-4);
  const midA = String(1000 + (Number(digits) * 17) % 9000);
  const midB = String(1000 + (Number(digits) * 41) % 9000);
  return `4580 ${midA} ${midB} ${digits}`;
}

/**
 * CVV דמו יציב לפי 4 ספרות אחרונות.
 * @param {string} lastFour
 * @returns {string}
 */
export function buildDemoCvv(lastFour) {
  const digits = String(lastFour || '').replace(/\D/g, '').padStart(4, '0').slice(-4);
  return String(100 + (Number(digits) * 13) % 900);
}

/**
 * משלים שדות תצוגה חסרים לכרטיס (מספר מלא / CVV / מסכה / תוקף).
 * @param {object} card
 * @returns {object}
 */
export function ensureCardDisplayFields(card) {
  const lastFour = String(card.lastFour || '').replace(/\D/g, '').padStart(4, '0').slice(-4) || '0000';
  const expiry = card.expiry
    || (card.expiryMonth && card.expiryYear
      ? `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`
      : '12/30');

  return {
    ...card,
    lastFour,
    numberMasked: card.numberMasked || `•••• •••• •••• ${lastFour}`,
    fullNumber: card.fullNumber || buildDemoFullNumber(lastFour),
    cvv: card.cvv || buildDemoCvv(lastFour),
    expiry,
  };
}

/**
 * @param {string} digits
 * @returns {string}
 */
export function maskIdNumber(digits) {
  const clean = String(digits || '').replace(/\D/g, '');

  if (clean.length < 3) {
    return '';
  }

  return `••••••${clean.slice(-3)}`;
}

/**
 * @param {string} isoDate YYYY-MM-DD
 * @param {number} monthsAgo
 * @returns {string}
 */
function shiftMonth(isoDate, monthsAgo) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1 - monthsAgo, Math.min(day, 28));
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {Date} [now]
 * @returns {string}
 */
export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * @param {{
 *   fullName: string,
 *   phone: string,
 *   idNumber: string,
 *   address: string,
 *   monthlySalary: number,
 *   cards: Array<{ productId: string, creditLimit?: number }>,
 *   expenses: Array<{ description: string, amount: number, category: string }>,
 *   investments: Array<{ symbol: string, name: string, type: string, value: number, dailyChangePercent?: number }>,
 *   branches: Array<{ id: string, name: string, code: string }>,
 * }} input
 */
export function buildOnboardingSnapshot(input) {
  const fullName = String(input.fullName || 'לקוח').trim();
  const phone = String(input.phone || '').trim() || `050-${randomInt(1000000, 9999999)}`;
  const idDigits = String(input.idNumber || '').replace(/\D/g, '') || String(randomInt(100000000, 999999999));
  const address = String(input.address || '').trim() || DEMO_STREETS[randomInt(0, DEMO_STREETS.length - 1)];
  const monthlySalary = Number(input.monthlySalary) > 0
    ? Number(input.monthlySalary)
    : randomInt(7200, 14500);

  const branches = Array.isArray(input.branches) ? input.branches : [];
  const branch = branches.length ? branches[randomInt(0, branches.length - 1)] : null;

  let cardInputs = Array.isArray(input.cards) ? input.cards.filter((row) => row?.productId) : [];

  if (cardInputs.length === 0) {
    cardInputs = [{ productId: 'debit' }, { productId: 'credit' }];
  }

  const now = new Date();
  const expiryYear = now.getFullYear() + randomInt(3, 5);
  const expiryMonth = randomInt(1, 12);

  const cards = cardInputs.map((row) => {
    const product = CARD_PRODUCTS.find((item) => item.id === row.productId) || CARD_PRODUCTS[0];
    const lastFour = randomLastFour();
    const month = String(expiryMonth).padStart(2, '0');
    const year2 = String(expiryYear).slice(-2);
    const creditLimit = Number(row.creditLimit) > 0 ? Number(row.creditLimit) : product.creditLimit;
    const id = crypto.randomUUID();

    return {
      id,
      brandName: 'הבנק שלנו',
      productName: product.productName,
      type: product.type,
      variant: product.variant || undefined,
      holderName: fullName,
      lastFour,
      numberMasked: `•••• •••• •••• ${lastFour}`,
      fullNumber: buildDemoFullNumber(lastFour),
      cvv: buildDemoCvv(lastFour),
      expiry: `${month}/${year2}`,
      expiryMonth,
      expiryYear,
      network: 'LocalPay',
      status: 'active',
      statusLabel: 'פעיל',
      creditLimit,
      debt: 0,
      blocked: false,
    };
  });

  let expenses = Array.isArray(input.expenses)
    ? input.expenses.filter((row) => row?.description && Number(row.amount) > 0)
    : [];

  if (expenses.length === 0) {
    expenses = [
      { description: 'חשמל', amount: randomMoney(220, 480), category: 'חשבונות' },
      { description: 'סלולר', amount: randomMoney(49, 99), category: 'תקשורת' },
      { description: 'ביטוח דירה', amount: randomMoney(140, 310), category: 'ביטוח' },
    ];
  }

  const recurring = expenses.map((row) => ({
    id: crypto.randomUUID(),
    description: String(row.description).trim(),
    amount: Number(Number(row.amount).toFixed(2)),
    category: String(row.category || 'חשבונות').trim() || 'חשבונות',
    dayOfMonth: 5,
  }));

  let investments = Array.isArray(input.investments)
    ? input.investments.filter((row) => row?.name && Number(row.value) > 0)
    : [];

  if (investments.length === 0) {
    investments = [{
      symbol: 'TA125',
      name: 'מדד ת״א 125',
      type: 'קרן סל',
      value: randomInt(2500, 8000),
      dailyChangePercent: 0.4,
    }];
  }

  const holdings = investments.map((row) => {
    const value = Number(Number(row.value).toFixed(2));
    return {
      id: crypto.randomUUID(),
      symbol: row.symbol || '',
      name: row.name,
      type: row.type || 'קרן סל',
      value,
      costBasis: value,
      dailyChangePercent: Number(row.dailyChangePercent) || 0,
    };
  });

  const monthlyExpenses = recurring.reduce((sum, row) => sum + row.amount, 0);
  const jitter = randomMoney(350, 2100);
  const balance = Number(Math.max(1500, monthlySalary * 2.15 - monthlyExpenses + jitter).toFixed(2));
  const today = todayIso(now);
  const salaryDate = now.getDate() >= 10 ? `${today.slice(0, 8)}10` : shiftMonth(`${today.slice(0, 8)}10`, 1);

  /** @type {Array<{ id: string, date: string, description: string, amount: number, category: string }>} */
  const transactions = [
    {
      id: crypto.randomUUID(),
      date: salaryDate,
      description: 'משכורת',
      amount: monthlySalary,
      category: 'הכנסה',
    },
    ...recurring.map((row) => ({
      id: crypto.randomUUID(),
      date: `${salaryDate.slice(0, 8)}05`,
      description: row.description,
      amount: -row.amount,
      category: row.category,
    })),
  ];

  const txSum = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const opening = Number((balance - txSum).toFixed(2));

  if (Math.abs(opening) >= 0.01) {
    transactions.push({
      id: crypto.randomUUID(),
      date: shiftMonth(today, 2),
      description: 'יתרת פתיחה',
      amount: opening,
      category: 'הכנסה',
    });
  }

  transactions.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return {
    phone,
    idNumberMasked: maskIdNumber(idDigits),
    address,
    monthlySalary,
    branch,
    cards,
    recurring,
    holdings,
    balance,
    transactions,
  };
}
