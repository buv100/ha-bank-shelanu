-- הרחבה לפתיחת חשבון: סימון setup + הוצאות קבועות.
-- מריצים פעם אחת ב-SQL Editor אם הסכמה כבר רצה.

alter table public.user_prefs
  add column if not exists setup_completed boolean not null default false;

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  category text not null default 'חשבונות',
  day_of_month smallint not null default 5
    check (day_of_month between 1 and 28)
);

alter table public.recurring_expenses enable row level security;

drop policy if exists recurring_own on public.recurring_expenses;

create policy recurring_own on public.recurring_expenses
  for all to authenticated
  using (public.is_owner(user_id))
  with check (public.is_owner(user_id));

grant select, insert, update, delete on table public.recurring_expenses to authenticated;
