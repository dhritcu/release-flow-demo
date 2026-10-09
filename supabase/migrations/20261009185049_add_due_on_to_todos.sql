set lock_timeout = '1s';
set statement_timeout = '5s';

-- Expand: nullable, so existing rows and older code are unaffected.
alter table todos add column if not exists due_on date;
