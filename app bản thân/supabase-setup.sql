create table if not exists public.lunand_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.lunand_user_data enable row level security;
drop policy if exists "Users can read own LunanD data" on public.lunand_user_data;
create policy "Users can read own LunanD data" on public.lunand_user_data for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert own LunanD data" on public.lunand_user_data;
create policy "Users can insert own LunanD data" on public.lunand_user_data for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own LunanD data" on public.lunand_user_data;
create policy "Users can update own LunanD data" on public.lunand_user_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lunand_user_data'
  ) then
    alter publication supabase_realtime add table public.lunand_user_data;
  end if;
end $$;