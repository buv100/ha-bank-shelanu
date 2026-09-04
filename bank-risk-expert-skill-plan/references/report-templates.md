# תבניות דוחות — bank-risk-expert

קובץ זה הוא `references/report-templates.md` בתוך ה-skill. כל דוח מיוצר כ-Google Doc אמיתי (כותרות = Heading styles, טבלאות = Doc tables). כל שאילתת SQL מניחה חיבור עם `service_role` (רואה את כל הלקוחות, לא מוגבל ל-RLS).

**כלל אחיד לכל הדוחות:** בסוף כל דוח — שורת `הופק אוטומטית על ידי bank-risk-expert · <תאריך ושעה> · מבוסס על נתוני דמו בלבד`. זה דוח מתוך אפליקציית דמו לימודית — לא נתוני בנק אמיתיים.

---

## 1. דוח רווח והפסד (P&L)

**מתי מפעילים:** "תבנה דוח רווח והפסד", "מה המצב הפיננסי של הבנק", "אחוז לקוחות רווחיים מול מפסידים".

**הגדרת "לקוח רווחי"** (עקבי עם `netAvailable` שכבר קיים ב-`src/utils/balances.js` של האפליקציה המקורית): `accounts.balance − SUM(cards.debt WHERE type='credit') > 0`.

### מבנה קבוע — תמיד באותו סדר:

```markdown
# דוח רווח והפסד — הבנק שלנו
תאריך הפקה: <ISO date>
טווח תנועות שנבדק: <30/90 יום אחורה — לפי מה שהתבקש, ברירת מחדל 30>

## תקציר מנהלים
- סה"כ לקוחות פעילים: <N>
- יתרת עו"ש מצטברת (כל הלקוחות): <סכום>
- חוב אשראי מצטבר: <סכום>
- מצב נטו מצטבר (יתרה − חוב): <סכום>
- לקוחות רווחיים: <N> (<%>) | לקוחות מפסידים: <N> (<%>)

## פירוט תזרים (טווח שנבדק)
| מדד | סכום |
|---|---|
| סה"כ הכנסות (תנועות חיוביות) | ₪X |
| סה"כ הוצאות (תנועות שליליות) | ₪X |
| הפרש נטו | ₪X |

## 10 לקוחות רווחיים מובילים
| # | שם | מס' לקוח | יתרה נטו |
|---|---|---|---|
...

## 10 לקוחות מפסידים מובילים
| # | שם | מס' לקוח | יתרה נטו | חוב אשראי |
|---|---|---|---|---|
...

## הערת מתודולוגיה
"לקוח רווחי" = יתרת עו"ש גבוהה מסך חוב האשראי שלו. אינו כולל השקעות/חסכונות (ניתן להרחיב).
```

### שאילתות ליבה
```sql
-- מצב נטו לכל לקוח
select
  p.id, p.full_name, p.customer_number,
  a.balance as checking_balance,
  coalesce(sum(c.debt) filter (where c.type = 'credit'), 0) as credit_debt,
  a.balance - coalesce(sum(c.debt) filter (where c.type = 'credit'), 0) as net_available
from profiles p
join accounts a on a.user_id = p.id and a.type = 'checking'
left join cards c on c.user_id = p.id
group by p.id, p.full_name, p.customer_number, a.balance
order by net_available desc;

-- תזרים בטווח (למשל 30 יום)
select
  sum(amount) filter (where amount > 0) as income,
  sum(amount) filter (where amount < 0) as expenses
from transactions
where posted_on >= current_date - interval '30 days';
```

---

## 2. דוח מידע לקוחות (Customer Directory)

**מתי מפעילים:** "תן לי רשימת כל הלקוחות", "דוח לקוחות מלא", "תראה לי את כל מי שרשום עם הפרטים שלו".

### מבנה קבוע:

```markdown
# דוח לקוחות — הבנק שלנו
תאריך הפקה: <ISO date>
סה"כ לקוחות: <N>

## טבלת לקוחות מלאה
| שם מלא | מס' לקוח | סניף | סטטוס חשבון | יתרת עו"ש | חוב אשראי | כרטיסים | תאריך הצטרפות |
|---|---|---|---|---|---|---|---|
<שורה לכל לקוח, ממוין לפי תאריך הצטרפות (created_at) יורד>

## פילוח לפי סטטוס חשבון
| סטטוס | כמות לקוחות |
|---|---|
| active | X |
| blocked | X |
| closed | X |

## פילוח לפי סניף
| סניף | כמות לקוחות | יתרה מצטברת |
|---|---|---|
```

### שאילתת ליבה
```sql
select
  p.full_name, p.customer_number, br.name as branch_name,
  p.account_status, a.balance,
  coalesce(sum(c.debt) filter (where c.type = 'credit'), 0) as credit_debt,
  count(c.id) as cards_count,
  p.created_at
from profiles p
join accounts a on a.user_id = p.id and a.type = 'checking'
left join branches br on br.id = p.branch_id
left join cards c on c.user_id = p.id
group by p.id, p.full_name, p.customer_number, br.name, p.account_status, a.balance, p.created_at
order by p.created_at desc;
```

---

## 3. דוח לקוחות בסיכון

**מתי מפעילים:** "מי הלקוחות הכי מסוכנים", "דוח סיכון שבועי", "תראה לי מי קרוב לחריגה".

חייב להציג **לכל לקוח** אילו אינדיקטורים ספציפיים הפעילו את הציון שלו — דוח שאומר רק "ציון 75" בלי הסבר חסר ערך לצוות שצריך להחליט מה לעשות איתו.

### מבנה קבוע:

```markdown
# דוח לקוחות בסיכון — הבנק שלנו
תאריך הפקה: <ISO date>
סף לכניסה לדוח: ציון סיכון ≥ 50

## תקציר מנהלים
- סה"כ לקוחות בסיכון (50-74): <N>
- סה"כ לקוחות בסיכון גבוה (75+): <N>
- אחוז מכלל הלקוחות: <%>

## פירוט לקוחות (ממוין מהציון הגבוה לנמוך)
| דירוג | שם | מס' לקוח | ציון | אינדיקטורים שהופעלו |
|---|---|---|---|---|
| 1 | ... | ... | 100 | ניצול אשראי 92% · יתרה שלילית · הלוואה ב-review |
...

## הערת מתודולוגיה
ציון = סכום 5 אינדיקטורים (25 נק' כל אחד) לפי סעיף 2 ב-SKILL.md הראשי. 50-74 = "לעקוב", 75+ = "בסיכון גבוה".
```

### שאילתת ליבה
```sql
with risk_flags as (
  select
    p.id, p.full_name, p.customer_number,
    a.balance,
    coalesce(sum(c.debt) filter (where c.type = 'credit'), 0) as credit_debt,
    coalesce(sum(c.credit_limit) filter (where c.type = 'credit'), 0) as credit_limit,
    p.monthly_salary,
    exists (
      select 1 from loan_applications la
      where la.user_id = p.id and la.status = 'review'
    ) as has_pending_loan,
    coalesce((
      select sum(t.amount) from transactions t
      join accounts acc2 on acc2.id = t.account_id
      where acc2.user_id = p.id and t.amount < 0
        and t.posted_on >= current_date - interval '30 days'
    ), 0) as spend_30d
  from profiles p
  join accounts a on a.user_id = p.id and a.type = 'checking'
  left join cards c on c.user_id = p.id
  group by p.id, p.full_name, p.customer_number, a.balance, p.monthly_salary
)
select *,
  (case when credit_limit > 0 and credit_debt / credit_limit > 0.8 then 25 else 0 end) as flag_utilization,
  (case when balance <= 0 then 25 else 0 end) as flag_balance,
  (case when monthly_salary > 0 and credit_debt / monthly_salary > 0.5 then 25 else 0 end) as flag_debt_income,
  (case when has_pending_loan then 25 else 0 end) as flag_pending_loan,
  (case when abs(spend_30d) > monthly_salary then 25 else 0 end) as flag_spend_trend
from risk_flags
-- לחבר את 5 העמודות flag_* לסכום אחד (score), לסנן score >= 50, למיין יורד
```

---

## 4. דוח פעילות חשודה בכרטיסים

**מתי מפעילים:** "תראה תנועות חשודות", "מה קרה עם הכרטיסים השבוע", "יש חיובים מוזרים?".

**הערה חשובה:** שני הכללים הראשונים (חריגה מ-2× max היסטורי, ו-velocity) דורשים חישוב "מה היה לפני התנועה הזו" לכל תנועה בנפרד — ב-SQL טהור אפשר עם window functions, אבל זה קריא/ניתן לתחזוקה יותר אם מריצים אותו בקוד האפליקציה (Python/Node) על תוצאה של שאילתה פשוטה שמביאה את כל התנועות בטווח, ולא מנסים לדחוס הכול ל-SQL אחד. שני הכללים האחרונים (מיצוי מסגרת, קטגוריה חדשה) פשוטים גם ב-SQL טהור.

### מבנה קבוע:

```markdown
# דוח פעילות חשודה בכרטיסים — הבנק שלנו
תאריך הפקה: <ISO date>
טווח שנבדק: <7/30 יום — ברירת מחדל 7>

## תקציר מנהלים
- סה"כ תנועות שסומנו: <N>
- מתוכן כרטיסים שנחסמו אוטומטית כתוצאה: <N>

## פירוט
| תאריך | לקוח | כרטיס (4 ספרות אחרונות) | סכום | סיבת סימון | נחסם? |
|---|---|---|---|---|---|
...

## פילוח לפי סיבת סימון
| סיבה | כמות |
|---|---|
| חריגה מ-2× ההוצאה הגבוהה ביותר | X |
| קצב גבוה (4+ תנועות/שעה) | X |
| קרוב למיצוי מסגרת (95%+) | X |
| קטגוריה חדשה + סכום גבוה | X |
```

### שאילתות בסיס (להזנה לקוד שמחשב את הכללים)
```sql
-- כל תנועות הכרטיסים בטווח, לחישוב הכללים באפליקציה
select ct.id, ct.card_id, ct.posted_on, ct.created_at, ct.amount, ct.category,
       c.user_id, c.credit_limit, c.debt, c.type, p.full_name
from card_transactions ct
join cards c on c.id = ct.card_id
join profiles p on p.id = c.user_id
where ct.posted_on >= current_date - interval '7 days'
order by ct.card_id, ct.created_at;

-- כרטיסים שכבר חסומים (לצורך "נחסם?" בטבלה, וגם מקור נתונים לחסימות אוטומטיות מ-audit_log)
select entity_id as card_id, created_at, meta->>'reason' as reason
from audit_log
where action = 'auto_block_card' and created_at >= current_date - interval '7 days';
```

---

## 5. דוח צנרת הלוואות (Loan Pipeline)

**מתי מפעילים:** "כמה הלוואות אושרו החודש", "מה מצב בקשות ההלוואה", "דוח הלוואות".

**מגבלת סכימה קיימת:** ל-`loan_applications` יש רק `created_at` (אין `decided_at`/`updated_at`) — **אי אפשר** לחשב "זמן ממוצע מבקשה להחלטה" בלי להוסיף עמודה. אם המדד הזה חשוב, צריך migration קטן (`alter table loan_applications add column decided_at timestamptz;`) ולעדכן אותה כשה-status משתנה מ-`submitted`. עד אז הדוח מדלג על המדד הזה ומציג רק ספירות/סכומים.

### מבנה קבוע:

```markdown
# דוח צנרת הלוואות — הבנק שלנו
תאריך הפקה: <ISO date>

## תקציר מנהלים
| סטטוס | כמות | סכום מצטבר |
|---|---|---|
| submitted | X | ₪X |
| review | X | ₪X |
| approved | X | ₪X |
| rejected | X | ₪X |

- אחוז אישורים (approved / (approved+rejected)): <%>

## בקשות פתוחות (submitted/review) הדורשות טיפול
| לקוח | סכום מבוקש | סטטוס | תאריך בקשה |
|---|---|---|---|
```

### שאילתת ליבה
```sql
select status, count(*) as count, sum(amount) as total_amount
from loan_applications
group by status;

select p.full_name, la.amount, la.status, la.created_at
from loan_applications la
join profiles p on p.id = la.user_id
where la.status in ('submitted', 'review')
order by la.created_at asc;
```

---

## 6. דוח פעילות הסוכן (Audit Trail Summary)

**מתי מפעילים:** "מה עשית השבוע", "תראה לי סיכום פעולות", "כמה פעמים חסמת כרטיסים לבד". **החשוב מכולם** — כי אין אישור אנושי לכל פעולה בודדת (ה"רשת ביטחון" בסעיף 5 ב-SKILL.md עוצרת רק על היקף חריג, לא בודקת כל פעולה), אז זה הדוח היחיד שנותן פיקוח בדיעבד על מה שהסוכן עשה.

### מבנה קבוע:

```markdown
# דוח פעילות סוכן — bank-risk-expert
תאריך הפקה: <ISO date>
טווח שנבדק: <7/30 יום>

## תקציר פעולות
| פעולה | כמות ביצועים | לקוחות מושפעים |
|---|---|---|
| auto_block_card | X | X |
| loan_approved | X | X |
| loan_rejected | X | X |

## פעמים שרשת הביטחון עצרה פעולה (היקף > 5 ישויות)
| תאריך | פקודה מקורית | כמה ישויות היו מושפעות |
|---|---|---|

## יומן מלא (chronological)
| תאריך ושעה | פעולה | ישות | נימוק (meta.reason) |
|---|---|---|---|
```

### שאילתת ליבה
```sql
select action, count(*) as executions, count(distinct entity_id) as affected_entities
from audit_log
where created_at >= current_date - interval '30 days'
group by action
order by executions desc;

select created_at, action, entity_type, entity_id, meta
from audit_log
where created_at >= current_date - interval '30 days'
order by created_at desc;
```
(פעולות "רשת ביטחון עצרה" דורשות action ייעודי משלהן, למשל `'safety_stop'`, שנרשם ל-audit_log עם `meta` שמכיל את הפקודה המקורית ואת רשימת הישויות — יש להוסיף את זה בקוד הסוכן.)

---

## 7. דוח לקוחות רדומים (Dormant Accounts)

**מתי מפעילים:** "מי לא פעיל", "תראה חשבונות ישנים בלי תנועות", "דוח נטישה".

### מבנה קבוע:

```markdown
# דוח לקוחות רדומים — הבנק שלנו
תאריך הפקה: <ISO date>
סף רדימות: <30/60/90 יום בלי תנועה — ברירת מחדל 60>

## תקציר מנהלים
- סה"כ לקוחות רדומים: <N> (<%> מהכלל)

## פירוט
| שם | מס' לקוח | תאריך תנועה אחרונה | ימים ללא פעילות | יתרה נוכחית |
|---|---|---|---|---|
```

### שאילתת ליבה
```sql
select
  p.full_name, p.customer_number,
  max(t.posted_on) as last_transaction,
  current_date - max(t.posted_on) as days_inactive,
  a.balance
from profiles p
join accounts a on a.user_id = p.id and a.type = 'checking'
left join transactions t on t.account_id = a.id
group by p.id, p.full_name, p.customer_number, a.balance
having max(t.posted_on) is null or max(t.posted_on) < current_date - interval '60 days'
order by last_transaction asc nulls first;
```
