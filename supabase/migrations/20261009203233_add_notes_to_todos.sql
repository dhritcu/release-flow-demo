set lock_timeout = '1s';
set statement_timeout = '5s';

-- Expand: nullable notes column.
alter table todos add column if not exists notes text;
