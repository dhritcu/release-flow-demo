set lock_timeout = '1s';
set statement_timeout = '5s';

-- Expand: a new column with a default, so code that ignores it keeps working.
alter table todos add column if not exists urgent boolean not null default false;
