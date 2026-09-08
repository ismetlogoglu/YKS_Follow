-- ============================================================================
--  Haftalık program tablosu
--  Şemayı daha önce kurduysan yalnızca BU dosyayı çalıştırman yeterli.
--  (schema.sql'in tamamını tekrar çalıştırmak da güvenli, veriyi bozmaz.)
--
--  Supabase paneli > SQL Editor > New query > yapıştır > Run
-- ============================================================================

create table if not exists public.weekly_schedule (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  hucreler    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.weekly_schedule enable row level security;

drop policy if exists "program_oku" on public.weekly_schedule;
create policy "program_oku" on public.weekly_schedule
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "program_yaz" on public.weekly_schedule;
create policy "program_yaz" on public.weekly_schedule
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
