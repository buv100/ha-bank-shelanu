/**
 * מכניס 3 לקוחות דמה (מסומנים בבירור בשם "דמו —") עם נתונים מהונדסים
 * כדי שדוח לקוחות בסיכון (references/report-templates.md #3) יראה תוצאות
 * אמיתיות, במקום להיות ריק כי בנתוני הדמו המקוריים אין אף אחד מעל הסף.
 *
 * יוצר דרך auth.users (לא ישירות profiles) כדי שהטריגר handle_new_user
 * הקיים ייצור profile+user_prefs+accounts אוטומטית, בדיוק כמו הרשמה אמיתית.
 *
 * להסרה: delete from auth.users where email like 'demo-risk-%@example.test'
 * (ה-cascade בסכימה מוחק profiles/accounts/cards/וכו' אוטומטית).
 */
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const db = new Client({ connectionString: env.SUPABASE_DB_URL });
db.on('error', (e) => console.error('[pg]', e.message));
await db.connect();

const customers = [
  {
    username: 'demo-yossi-risk',
    fullName: 'דמו — יוסי חייב',
    email: 'demo-risk-yossi@example.test',
    monthlySalary: 15000,
    balance: -500, // flag_balance
    card: { creditLimit: 5000, debt: 4500 }, // 90% ניצול > flag_utilization
    pendingLoan: false,
    expectedScore: 50,
  },
  {
    username: 'demo-ruti-risk',
    fullName: 'דמו — רותי לחוצה',
    email: 'demo-risk-ruti@example.test',
    monthlySalary: 10000,
    balance: 1000,
    card: { creditLimit: 10000, debt: 6000 }, // 60% ניצול (לא חוצה 80%), אבל 60% מהמשכורת > flag_debt_income
    pendingLoan: true, // flag_pending_loan
    expectedScore: 50,
  },
  {
    username: 'demo-avi-risk',
    fullName: 'דמו — אבי בסיכון גבוה',
    email: 'demo-risk-avi@example.test',
    monthlySalary: 6000,
    balance: -200, // flag_balance
    card: { creditLimit: 4000, debt: 3800 }, // 95% > flag_utilization, וגם 63% מהמשכורת > flag_debt_income
    pendingLoan: true, // flag_pending_loan
    expectedScore: 100,
  },
];

for (const c of customers) {
  const userId = randomUUID();

  await db.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
     values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, null, now(), now(), now(), '{"provider":"email","providers":["email"]}', $3::jsonb)`,
    [userId, c.email, JSON.stringify({ username: c.username, full_name: c.fullName })],
  );

  // הטריגר handle_new_user כבר יצר profiles/user_prefs/simulator_state/accounts —
  // כאן רק מעדכנים ערכים כדי להפעיל את אינדיקטורי הסיכון.
  await db.query(`update public.profiles set monthly_salary = $2 where id = $1`, [userId, c.monthlySalary]);
  await db.query(`update public.accounts set balance = $2 where user_id = $1 and type = 'checking'`, [userId, c.balance]);

  const { rows: [account] } = await db.query(`select id from public.accounts where user_id = $1 and type = 'checking'`, [userId]);
  await db.query(
    `insert into public.cards (user_id, account_id, type, product_name, brand_name, holder_name, last_four, expiry_month, expiry_year, credit_limit, debt)
     values ($1, $2, 'credit', 'כרטיס דמו', 'הבנק שלנו', $3, '0000', 12, 2030, $4, $5)`,
    [userId, account.id, c.fullName, c.card.creditLimit, c.card.debt],
  );

  if (c.pendingLoan) {
    await db.query(`insert into public.loan_applications (user_id, amount, status) values ($1, 20000, 'review')`, [userId]);
  }

  console.log(`נוצר: ${c.fullName} (${c.email}) — צפוי ציון סיכון: ${c.expectedScore}`);
}

await db.end();
console.log('\nלהסרה מאוחר יותר: delete from auth.users where email like \'demo-risk-%@example.test\';');
