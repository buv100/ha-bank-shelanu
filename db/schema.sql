-- סכמת Postgres ל«הבנק שלנו» — מיועד ל־Supabase.
-- מריצים ב־SQL Editor של הפרויקט (או supabase db push).
-- סיסמאות לא נשמרות כאן: רק ב־auth.users של Supabase.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- פונקציית עזר: האם השורה שייכת למשתמש המחובר
-- ---------------------------------------------------------------------------
create or replace function public.is_owner(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target is not null and target = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- קטלוגים (כולם קוראים; כתיבה רק דרך דשבורד / service role)
-- ---------------------------------------------------------------------------

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table public.market_instruments (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null unique,
  type text not null,
  unit_price numeric(14, 2) not null check (unit_price > 0),
  daily_change_percent numeric(8, 2) not null default 0,
  description text not null default '',
  risk text not null default 'בינוני',
  currency text not null default 'ILS',
  exchange text not null default 'דמו',
  expense_ratio_percent numeric(6, 2) not null default 0,
  ytd_percent numeric(8, 2) not null default 0,
  year1_percent numeric(8, 2) not null default 0,
  week_change_percent numeric(8, 2)[] not null default '{}',
  tags text[] not null default '{}'
);

create table public.purchase_templates (
  id uuid primary key default gen_random_uuid(),
  description text not null unique,
  category text not null,
  min_amount numeric(14, 2) not null check (min_amount > 0),
  max_amount numeric(14, 2) not null check (max_amount >= min_amount)
);

-- ---------------------------------------------------------------------------
-- זהות לקוח (id = auth.users.id)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-zA-Z0-9._-]{3,32}$'),
  full_name text not null,
  initials text not null default '',
  phone text,
  id_number_masked text,
  address text,
  customer_number text not null unique,
  branch_id uuid references public.branches (id),
  monthly_salary numeric(14, 2) not null default 0 check (monthly_salary >= 0),
  account_status text not null default 'active'
    check (account_status in ('active', 'blocked', 'closed')),
  created_at timestamptz not null default now()
);

create table public.user_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  hide_balance boolean not null default false,
  hide_loan boolean not null default false,
  notifications_enabled boolean not null default true,
  setup_completed boolean not null default false
);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  category text not null default 'חשבונות',
  day_of_month smallint not null default 5
    check (day_of_month between 1 and 28)
);

create table public.simulator_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default true,
  last_run_at timestamptz
);

-- ---------------------------------------------------------------------------
-- בנקאות
-- ---------------------------------------------------------------------------

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'checking'
    check (type in ('checking')),
  currency text not null default 'ILS',
  balance numeric(14, 2) not null default 0,
  status text not null default 'active'
    check (status in ('active', 'frozen', 'closed')),
  unique (user_id, type)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  posted_on date not null default (timezone('Asia/Jerusalem', now()))::date,
  description text not null,
  amount numeric(14, 2) not null check (amount <> 0),
  category text not null default 'אחר',
  source text not null default 'manual'
    check (source in ('manual', 'salary', 'debit_card', 'credit_card', 'investment', 'simulator')),
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);
create index if not exists profiles_username_lower_idx on public.profiles (lower(username));

create index if not exists transactions_account_posted_idx
  on public.transactions (account_id, posted_on desc);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  type text not null check (type in ('debit', 'credit')),
  variant text,
  product_name text not null,
  brand_name text not null default 'הבנק שלנו',
  holder_name text not null,
  last_four char(4) not null check (last_four ~ '^[0-9]{4}$'),
  expiry_month smallint not null check (expiry_month between 1 and 12),
  expiry_year smallint not null check (expiry_year between 2026 and 2040),
  network text not null default 'LocalPay',
  credit_limit numeric(14, 2) not null default 0 check (credit_limit >= 0),
  debt numeric(14, 2) not null default 0 check (debt >= 0),
  blocked boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'blocked', 'expired'))
);

create table public.card_transactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  posted_on date not null default (timezone('Asia/Jerusalem', now()))::date,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  category text not null default 'קניות',
  created_at timestamptz not null default now()
);

create index if not exists cards_user_id_idx on public.cards (user_id);

create index if not exists card_transactions_card_posted_idx
  on public.card_transactions (card_id, posted_on desc);

-- ---------------------------------------------------------------------------
-- מסחר — כל החזקה חייבת מכשיר בשוק
-- ---------------------------------------------------------------------------

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  instrument_id uuid not null references public.market_instruments (id) on delete restrict,
  value numeric(14, 2) not null check (value >= 0),
  cost_basis numeric(14, 2) not null check (cost_basis >= 0),
  daily_change_percent numeric(8, 2) not null default 0,
  unique (user_id, instrument_id)
);

create index if not exists holdings_user_id_idx on public.holdings (user_id);

create table public.watchlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  instrument_id uuid not null references public.market_instruments (id) on delete cascade,
  primary key (user_id, instrument_id)
);

create table public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'submitted'
    check (status in ('submitted', 'review', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_log_user_created_idx
  on public.audit_log (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- טריגר: אחרי הרשמה ב־Auth נוצרים פרופיל + העדפות + מצב סימולטור
-- username / full_name מגיעים מ־raw_user_meta_data בהרשמה
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_username text;
  new_name text;
  new_initials text;
  new_phone text;
begin
  new_username := coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1));
  new_name := coalesce(new.raw_user_meta_data ->> 'full_name', new_username);
  new_initials := coalesce(
    new.raw_user_meta_data ->> 'initials',
    left(new_name, 1)
  );
  new_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');

  insert into public.profiles (id, username, full_name, initials, phone, customer_number)
  values (
    new.id,
    new_username,
    new_name,
    new_initials,
    new_phone,
    'C' || lpad(floor(random() * 10000000)::text, 7, '0')
  );

  insert into public.user_prefs (user_id) values (new.id);
  insert into public.simulator_state (user_id, last_run_at) values (new.id, now());
  insert into public.accounts (user_id) values (new.id);

  return new;
end;
$$;

-- המרת שם משתמש לאימייל לצורך signIn (בלי לחשוף משתמשים אחרים ברשימה)
create or replace function public.email_for_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- דמו: אישור מייל אוטומטי (בלי קישור במייל). אפשר גם לכבות Confirm email ב־Supabase Dashboard.
create or replace function public.auto_confirm_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;

create trigger on_auth_user_auto_confirm
  after insert on auth.users
  for each row execute function public.auto_confirm_auth_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.branches enable row level security;
alter table public.market_instruments enable row level security;
alter table public.purchase_templates enable row level security;
alter table public.profiles enable row level security;
alter table public.user_prefs enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.simulator_state enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.cards enable row level security;
alter table public.card_transactions enable row level security;
alter table public.holdings enable row level security;
alter table public.watchlist enable row level security;
alter table public.loan_applications enable row level security;
alter table public.audit_log enable row level security;

-- קטלוגים: כל מחובר יכול לקרוא
create policy branches_select on public.branches
  for select to authenticated using (true);

create policy market_select on public.market_instruments
  for select to authenticated using (true);

create policy purchase_templates_select on public.purchase_templates
  for select to authenticated using (true);

-- פרופיל והעדפות: רק השורה שלי
create policy profiles_select on public.profiles
  for select to authenticated using (public.is_owner(id));

create policy profiles_update on public.profiles
  for update to authenticated using (public.is_owner(id)) with check (public.is_owner(id));

create policy prefs_select on public.user_prefs
  for select to authenticated using (public.is_owner(user_id));

create policy prefs_update on public.user_prefs
  for update to authenticated using (public.is_owner(user_id)) with check (public.is_owner(user_id));

create policy recurring_own on public.recurring_expenses
  for all to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy simulator_select on public.simulator_state
  for select to authenticated using (public.is_owner(user_id));

create policy simulator_update on public.simulator_state
  for update to authenticated using (public.is_owner(user_id)) with check (public.is_owner(user_id));

create policy accounts_select on public.accounts
  for select to authenticated using (public.is_owner(user_id));

create policy accounts_update on public.accounts
  for update to authenticated using (public.is_owner(user_id)) with check (public.is_owner(user_id));

create policy transactions_select on public.transactions
  for select to authenticated
  using (
    exists (
      select 1 from public.accounts a
      where a.id = account_id and public.is_owner(a.user_id)
    )
  );

create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.accounts a
      where a.id = account_id and public.is_owner(a.user_id)
    )
  );

create policy cards_own on public.cards
  for all to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy card_tx_select on public.card_transactions
  for select to authenticated
  using (
    exists (
      select 1 from public.cards c
      where c.id = card_id and public.is_owner(c.user_id)
    )
  );

create policy card_tx_insert on public.card_transactions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.cards c
      where c.id = card_id and public.is_owner(c.user_id)
    )
  );

create policy holdings_own on public.holdings
  for all to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy watchlist_own on public.watchlist
  for all to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

create policy loans_own on public.loan_applications
  for all to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

-- יומן: הוספה + קריאה של השורות שלי; אין עדכון/מחיקה
create policy audit_select on public.audit_log
  for select to authenticated using (public.is_owner(user_id));

create policy audit_insert on public.audit_log
  for insert to authenticated with check (public.is_owner(user_id));

-- ---------------------------------------------------------------------------
-- הרשאות (מעבר ל־RLS)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant execute on function public.email_for_username(text) to anon, authenticated;

grant select on table public.branches to authenticated;
grant select on table public.market_instruments to authenticated;
grant select on table public.purchase_templates to authenticated;

grant select, update on table public.profiles to authenticated;
grant select, update on table public.user_prefs to authenticated;
grant select, insert, update, delete on table public.recurring_expenses to authenticated;
grant select, update on table public.simulator_state to authenticated;
grant select, update on table public.accounts to authenticated;
grant select, insert on table public.transactions to authenticated;
grant select, insert, update on table public.cards to authenticated;
grant select, insert on table public.card_transactions to authenticated;
grant select, insert, update, delete on table public.holdings to authenticated;
grant select, insert, delete on table public.watchlist to authenticated;
grant select, insert, update on table public.loan_applications to authenticated;
grant select, insert on table public.audit_log to authenticated;
