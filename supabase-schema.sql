create table if not exists public.monthly_plans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,
  plan jsonb not null default '{"goals": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_key)
);
alter table public.monthly_plans enable row level security;
create policy "Users read own plans" on public.monthly_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own plans" on public.monthly_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own plans" on public.monthly_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own plans" on public.monthly_plans for delete to authenticated using ((select auth.uid()) = user_id);
