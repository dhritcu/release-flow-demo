set lock_timeout = '1s';
set statement_timeout = '5s';

create table if not exists todos (
  id bigint generated always as identity primary key,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- The API reaches the table through the server-side connection only.
alter table todos enable row level security;
