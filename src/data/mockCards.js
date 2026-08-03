/**
 * נתוני דמה לכרטיסים.
 * כאן משנים פרטי כרטיס בלי לגעת בעיצוב או בדף.
 */

/** רשימת כרטיסי הדמו */
export const mockCards = [
  {
    id: 'card-1',
    brandName: 'הבנק שלנו',
    productName: 'כרטיס חיוב',
    type: 'debit',
    holderName: 'ישראל ישראלי',
    /** 4 ספרות אחרונות לתצוגה */
    lastFour: '4582',
    /** מספר מלא לדמו — מוצג רק אחרי אישור הצגה */
    fullNumber: '4580 1234 5678 4582',
    /** מספר ממוסך לתצוגה הרגילה */
    numberMasked: '•••• •••• •••• 4582',
    expiry: '08/28',
    /** 3 ספרות בגב הכרטיס — רק אחרי אישור */
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
    /** 4 ספרות אחרונות לתצוגה */
    lastFour: '4583',
    /** מספר מלא לדמו — מוצג רק אחרי אישור הצגה */
    fullNumber: '4580 4321 8765 4583',
    /** מספר ממוסך לתצוגה הרגילה */
    numberMasked: '•••• •••• •••• 4583',
    expiry: '06/31',
    /** 3 ספרות בגב הכרטיס — רק אחרי אישור */
    cvv: '456',
    status: 'active',
    statusLabel: 'פעיל',
    network: 'LocalPay',
  },
];
