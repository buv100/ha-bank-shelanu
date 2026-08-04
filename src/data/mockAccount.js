/**
 * ייצוא תאימות לאחור — מקור האמת ב־mockUsers (משתמש 1).
 * האפליקציה משתמשת ב־getCurrentAccount / getCurrentTransactions.
 */

import { mockUsers } from './mockUsers.js';

const primaryUser = mockUsers[0];

/** חשבון העו״ש של משתמש הדמו הראשון */
export const mockAccount = primaryUser.account;

/** תנועות משתמש הדמו הראשון */
export const mockTransactions = primaryUser.transactions;
