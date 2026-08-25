-- מבטל אישור מייל אוטומטי — כדי שאימות אימייל בהרשמה יעבוד.
-- מריצים פעם אחת ב-SQL Editor אם הרצתם בעבר auto_confirm.sql.

drop trigger if exists on_auth_user_auto_confirm on auth.users;
drop function if exists public.auto_confirm_auth_user() cascade;
