-- מוחק את אובייקטי הסכמה של הדמו כדי להריץ schema.sql מחדש נקי.
-- זהירות: מוחק גם נתונים בטבלאות האלה.

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_auto_confirm on auth.users;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.auto_confirm_auth_user() cascade;
drop function if exists public.email_for_username(text) cascade;
drop function if exists public.is_owner(uuid) cascade;

drop table if exists public.audit_log cascade;
drop table if exists public.loan_applications cascade;
drop table if exists public.watchlist cascade;
drop table if exists public.holdings cascade;
drop table if exists public.card_transactions cascade;
drop table if exists public.cards cascade;
drop table if exists public.transactions cascade;
drop table if exists public.accounts cascade;
drop table if exists public.simulator_state cascade;
drop table if exists public.recurring_expenses cascade;
drop table if exists public.user_prefs cascade;
drop table if exists public.profiles cascade;
drop table if exists public.purchase_templates cascade;
drop table if exists public.market_instruments cascade;
drop table if exists public.branches cascade;
