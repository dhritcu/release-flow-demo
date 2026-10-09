set lock_timeout = '1s';
set statement_timeout = '5s';

-- Expand: nullable, filled from now on when a todo is completed.
alter table todos add column if not exists completed_at timestamptz;
