set lock_timeout = '1s';
set statement_timeout = '5s';

-- Repair titles saved with surrounding spaces since feature A.
update todos set title = btrim(title) where title <> btrim(title);

-- Expand-safe guard for new rows. NOT VALID skips the full-table scan; the
-- update above already cleaned existing rows.
alter table todos add constraint todos_title_trimmed check (title = btrim(title)) not valid;
