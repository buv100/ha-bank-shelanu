/**
 * משתמשי דמו — כל משתמש עם פרופיל, חשבון, תנועות וכרטיסים.
 * בלי אדמין בשלב זה (role: customer בלבד).
 */

/** @typedef {'customer'} UserRole */

/**
 * @typedef {object} DemoUser
 * @property {string} id
 * @property {UserRole} role
 * @property {object} profile
 * @property {object} account
 * @property {object[]} transactions
 * @property {object[]} cards
 */

/** רשימת משתמשי הדמו */
export const mockUsers = [
  {
    id: 'user-1',
    role: 'customer',
    profile: {
      id: 'user-1',
      fullName: 'ישראל ישראלי',
      initials: 'יי',
      email: 'israel@example.com',
      phone: '050-1234567',
      idNumberMasked: '••••••789',
      address: 'רחוב הדמו 12, תל אביב',
      customerNumber: '2048193',
      branchName: 'סניף מרכז',
      branchCode: '612',
      accountStatus: 'active',
      accountStatusLabel: 'פעיל',
    },
    account: {
      id: 'acc-1',
      type: 'checking',
      currency: 'ILS',
      balance: 75000,
    },
    transactions: [
      { id: 'tx-1', date: '2026-07-28', description: 'משכורת', amount: 12000, category: 'הכנסה' },
      { id: 'tx-2', date: '2026-07-27', description: 'קניות', amount: -312.4, category: 'קניות' },
      { id: 'tx-3', date: '2026-07-26', description: 'תחבורה', amount: -287.0, category: 'תחבורה' },
      { id: 'tx-4', date: '2026-07-25', description: 'חשבונות', amount: -419.5, category: 'חשבונות' },
      { id: 'tx-5', date: '2026-07-24', description: 'העברה נכנסת', amount: 5000, category: 'הכנסה' },
      { id: 'tx-6', date: '2026-07-23', description: 'אוכל', amount: -280.0, category: 'אוכל' },
      { id: 'tx-7', date: '2026-07-22', description: 'בידור', amount: -54.9, category: 'בידור' },
      { id: 'tx-8', date: '2026-07-21', description: 'בריאות', amount: -67.3, category: 'בריאות' },
      { id: 'tx-9', date: '2026-07-20', description: 'החזר', amount: 180, category: 'הכנסה' },
      { id: 'tx-10', date: '2026-07-19', description: 'אוכל', amount: -246.0, category: 'אוכל' },
    ],
    cards: [
      {
        id: 'card-1',
        brandName: 'הבנק שלנו',
        productName: 'כרטיס חיוב',
        type: 'debit',
        holderName: 'ישראל ישראלי',
        lastFour: '4582',
        fullNumber: '4580 1234 5678 4582',
        numberMasked: '•••• •••• •••• 4582',
        expiry: '08/28',
        cvv: '317',
        status: 'active',
        statusLabel: 'פעיל',
        network: 'LocalPay',
      },
      {
        id: 'card-2',
        brandName: 'הבנק שלנו',
        productName: 'כרטיס אשראי',
        type: 'credit',
        holderName: 'ישראל ישראלי',
        lastFour: '4583',
        fullNumber: '4580 4321 8765 4583',
        numberMasked: '•••• •••• •••• 4583',
        expiry: '06/31',
        cvv: '456',
        status: 'active',
        statusLabel: 'פעיל',
        network: 'LocalPay',
      },
    ],
  },
  {
    id: 'user-2',
    role: 'customer',
    profile: {
      id: 'user-2',
      fullName: 'נועה כהן',
      initials: 'נכ',
      email: 'noa@example.com',
      phone: '052-9876543',
      idNumberMasked: '••••••221',
      address: 'שדרות הדוגמה 5, חיפה',
      customerNumber: '3084412',
      branchName: 'סניף צפון',
      branchCode: '418',
      accountStatus: 'active',
      accountStatusLabel: 'פעיל',
    },
    account: {
      id: 'acc-2',
      type: 'checking',
      currency: 'ILS',
      balance: 18450.5,
    },
    transactions: [
      { id: 'n-tx-1', date: '2026-07-28', description: 'משכורת', amount: 9800, category: 'הכנסה' },
      { id: 'n-tx-2', date: '2026-07-27', description: 'קניות', amount: -540.2, category: 'קניות' },
      { id: 'n-tx-3', date: '2026-07-26', description: 'אוכל', amount: -186.0, category: 'אוכל' },
      { id: 'n-tx-4', date: '2026-07-25', description: 'תחבורה', amount: -92.5, category: 'תחבורה' },
      { id: 'n-tx-5', date: '2026-07-24', description: 'בידור', amount: -120.0, category: 'בידור' },
      { id: 'n-tx-6', date: '2026-07-23', description: 'חשבונות', amount: -310.0, category: 'חשבונות' },
      { id: 'n-tx-7', date: '2026-07-22', description: 'העברה נכנסת', amount: 1500, category: 'הכנסה' },
      { id: 'n-tx-8', date: '2026-07-21', description: 'קניות', amount: -75.9, category: 'קניות' },
    ],
    cards: [
      {
        id: 'card-n1',
        brandName: 'הבנק שלנו',
        productName: 'כרטיס חיוב',
        type: 'debit',
        holderName: 'נועה כהן',
        lastFour: '7712',
        fullNumber: '4580 9988 7766 7712',
        numberMasked: '•••• •••• •••• 7712',
        expiry: '11/29',
        cvv: '194',
        status: 'active',
        statusLabel: 'פעיל',
        network: 'LocalPay',
      },
    ],
  },
  {
    id: 'user-3',
    role: 'customer',
    profile: {
      id: 'user-3',
      fullName: 'דני לוי',
      initials: 'דל',
      email: 'dani@example.com',
      phone: '054-1122334',
      idNumberMasked: '••••••556',
      address: 'רחוב הלימודים 3, באר שבע',
      customerNumber: '5190034',
      branchName: 'סניף דרום',
      branchCode: '227',
      accountStatus: 'active',
      accountStatusLabel: 'פעיל',
    },
    account: {
      id: 'acc-3',
      type: 'checking',
      currency: 'ILS',
      balance: 4200,
    },
    transactions: [
      { id: 'd-tx-1', date: '2026-07-28', description: 'העברה נכנסת', amount: 2000, category: 'הכנסה' },
      { id: 'd-tx-2', date: '2026-07-27', description: 'אוכל', amount: -95.0, category: 'אוכל' },
      { id: 'd-tx-3', date: '2026-07-26', description: 'תחבורה', amount: -48.0, category: 'תחבורה' },
      { id: 'd-tx-4', date: '2026-07-25', description: 'קניות', amount: -210.3, category: 'קניות' },
      { id: 'd-tx-5', date: '2026-07-24', description: 'חשבונות', amount: -180.0, category: 'חשבונות' },
      { id: 'd-tx-6', date: '2026-07-23', description: 'בידור', amount: -39.9, category: 'בידור' },
    ],
    cards: [
      {
        id: 'card-d1',
        brandName: 'הבנק שלנו',
        productName: 'כרטיס אשראי',
        type: 'credit',
        holderName: 'דני לוי',
        lastFour: '3301',
        fullNumber: '4580 2211 0099 3301',
        numberMasked: '•••• •••• •••• 3301',
        expiry: '03/27',
        cvv: '802',
        status: 'active',
        statusLabel: 'פעיל',
        network: 'LocalPay',
      },
    ],
  },
];

/**
 * מוצא משתמש לפי מזהה.
 * @param {string} userId
 * @returns {DemoUser | undefined}
 */
export function findUserById(userId) {
  return mockUsers.find((user) => user.id === userId);
}

/**
 * רשימה קצרה לבחירה במסך התחברות.
 * @returns {Array<{ id: string, fullName: string, email: string, initials: string }>}
 */
export function getLoginUserOptions() {
  return mockUsers.map((user) => ({
    id: user.id,
    fullName: user.profile.fullName,
    email: user.profile.email,
    initials: user.profile.initials,
  }));
}
