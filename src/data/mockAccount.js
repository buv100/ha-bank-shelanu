/**
 * נתוני דמה לחשבון עו״ש — שלב 1.
 * כאן משנים בקלות את היתרה ואת רשימת התנועות (בלי שרת ובלי localStorage).
 */

/** חשבון העו״ש של הדמו */
export const mockAccount = {
  id: 'acc-1',
  type: 'checking',
  currency: 'ILS',
  balance: 50578.75,
};

/**
 * עשר תנועות אחרונות — סכום חיובי = הכנסה, שלילי = הוצאה.
 * אפשר להוסיף/למחוק/לשנות כאן בלי לגעת בדפי התצוגה.
 */
export const mockTransactions = [
  {
    id: 'tx-1',
    date: '2026-07-28',
    description: 'משכורת',
    amount: 12000,
    category: 'הכנסה',
  },
  {
    id: 'tx-2',
    date: '2026-07-27',
    description: 'קניות',
    amount: -312.4,
    category: 'קניות',
  },
  {
    id: 'tx-3',
    date: '2026-07-26',
    description: 'תחבורה',
    amount: -287.0,
    category: 'תחבורה',
  },
  {
    id: 'tx-4',
    date: '2026-07-25',
    description: 'חשבונות',
    amount: -419.5,
    category: 'חשבונות',
  },
  {
    id: 'tx-5',
    date: '2026-07-24',
    description: 'העברה נכנסת',
    amount: 5000,
    category: 'הכנסה',
  },
  {
    id: 'tx-6',
    date: '2026-07-23',
    description: 'אוכל',
    amount: -280.0,
    category: 'אוכל',
  },
  {
    id: 'tx-7',
    date: '2026-07-22',
    description: 'בידור',
    amount: -54.9,
    category: 'בידור',
  },
  {
    id: 'tx-8',
    date: '2026-07-21',
    description: 'בריאות',
    amount: -67.3,
    category: 'בריאות',
  },
  {
    id: 'tx-9',
    date: '2026-07-20',
    description: 'החזר',
    amount: 180,
    category: 'הכנסה',
  },
  {
    id: 'tx-10',
    date: '2026-07-19',
    description: 'אוכל',
    amount: -246.0,
    category: 'אוכל',
  },
];
