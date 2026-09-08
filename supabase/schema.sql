-- ============================================================================
--  YKS Takip — Supabase şeması
--  Supabase panelinde SQL Editor > New query içine yapıştırıp "Run" de.
--  Tekrar çalıştırılabilir (idempotent): var olanı bozmaz.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) PROFİLLER
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  ad_soyad          text,
  alan              text check (alan in ('SAY', 'EA', 'SOZ')),
  hedef_universite  text,
  hedef_bolum       text,
  hedef_siralama    integer check (hedef_siralama is null or hedef_siralama > 0),
  sinav_tarihi      date,
  is_admin          boolean not null default false,
  kurulum_tamam     boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2) HEDEF NETLER  (Excel'deki "Hedef" sayfası)
-- ---------------------------------------------------------------------------
create table if not exists public.net_targets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  sinav       text not null check (sinav in ('TYT', 'AYT')),
  ders        text not null,
  hedef_net   numeric(6, 2) not null default 0 check (hedef_net >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, sinav, ders)
);

-- ---------------------------------------------------------------------------
-- 3) GÜNLÜK ÇALIŞMA  (Excel'deki "Günlük Takip" sayfası)
--    net sütunu veritabanında hesaplanır: Net = Doğru − Yanlış/4
-- ---------------------------------------------------------------------------
create table if not exists public.study_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  tarih       date not null,
  sinav       text not null check (sinav in ('TYT', 'AYT')),
  ders        text not null,
  konu        text,
  soru        integer not null check (soru >= 0),
  dogru       integer check (dogru is null or dogru >= 0),
  yanlis      integer check (yanlis is null or yanlis >= 0),
  bos         integer check (bos is null or bos >= 0),
  sure_dk     integer check (sure_dk is null or sure_dk >= 0),
  not_metni   text,
  net         numeric(6, 2) generated always as (
                case
                  when dogru is null and yanlis is null then null
                  else coalesce(dogru, 0) - coalesce(yanlis, 0) / 4.0
                end
              ) stored,
  created_at  timestamptz not null default now()
);

create index if not exists study_logs_user_tarih_idx on public.study_logs (user_id, tarih desc);
create index if not exists study_logs_tarih_idx on public.study_logs (tarih);

-- ---------------------------------------------------------------------------
-- 4) DENEMELER  (Excel'deki "Deneme TYT" / "Deneme AYT" sayfaları)
-- ---------------------------------------------------------------------------
create table if not exists public.mock_exams (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  tarih       date not null,
  sinav       text not null check (sinav in ('TYT', 'AYT')),
  ad          text not null,
  yayin       text,
  not_metni   text,
  created_at  timestamptz not null default now()
);

create index if not exists mock_exams_user_tarih_idx on public.mock_exams (user_id, tarih desc);
create index if not exists mock_exams_tarih_idx on public.mock_exams (tarih);

create table if not exists public.mock_exam_sections (
  id            uuid primary key default gen_random_uuid(),
  mock_exam_id  uuid not null references public.mock_exams (id) on delete cascade,
  ders          text not null,
  soru_sayisi   integer not null check (soru_sayisi > 0),
  dogru         integer not null default 0 check (dogru >= 0),
  yanlis        integer not null default 0 check (yanlis >= 0),
  net           numeric(6, 2) generated always as (dogru - yanlis / 4.0) stored,
  unique (mock_exam_id, ders),
  check (dogru + yanlis <= soru_sayisi)
);

create index if not exists mock_exam_sections_exam_idx on public.mock_exam_sections (mock_exam_id);

-- ---------------------------------------------------------------------------
-- 4b) HAFTALIK PROGRAM
--     7 gün x 3 satır = 21 hücre. Ayrı satırlar yerine tek jsonb: program hep
--     bir bütün olarak okunup yazılıyor, 21 satırlık tablo boşuna karmaşa olurdu.
--     Anahtar biçimi "<gun>-<satir>", örn. "0-2" = Pazartesi 3. satır.
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_schedule (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  hucreler    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5) DENEME TOPLAMLARI GÖRÜNÜMÜ
--    security_invoker: görünümü sorgulayan kullanıcının RLS kuralları geçerli olur.
-- ---------------------------------------------------------------------------
create or replace view public.mock_exam_totals
with (security_invoker = true) as
select
  e.id,
  e.user_id,
  e.tarih,
  e.sinav,
  e.ad,
  e.yayin,
  e.not_metni,
  coalesce(sum(s.dogru), 0)::int                        as toplam_dogru,
  coalesce(sum(s.yanlis), 0)::int                       as toplam_yanlis,
  coalesce(sum(s.soru_sayisi), 0)::int                  as toplam_soru,
  coalesce(sum(s.soru_sayisi) - sum(s.dogru) - sum(s.yanlis), 0)::int as toplam_bos,
  coalesce(sum(s.net), 0)::numeric(6, 2)                as toplam_net
from public.mock_exams e
left join public.mock_exam_sections s on s.mock_exam_id = e.id
group by e.id;

-- ---------------------------------------------------------------------------
-- 6) YENİ KULLANICI → OTOMATİK PROFİL
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, ad_soyad)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'ad_soyad',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 7) ADMIN KONTROLÜ
--    security definer olması şart: aksi halde profiles üzerindeki RLS politikası
--    kendini çağırır ve sonsuz özyineleme hatası alınır.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 8) ROW LEVEL SECURITY
--    Herkes yalnızca kendi verisini görür; admin hepsini okur ama yazamaz.
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.net_targets        enable row level security;
alter table public.study_logs         enable row level security;
alter table public.mock_exams         enable row level security;
alter table public.mock_exam_sections enable row level security;
alter table public.weekly_schedule    enable row level security;

-- weekly_schedule -----------------------------------------------------------
drop policy if exists "program_oku" on public.weekly_schedule;
create policy "program_oku" on public.weekly_schedule
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "program_yaz" on public.weekly_schedule;
create policy "program_yaz" on public.weekly_schedule
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- profiles ------------------------------------------------------------------
drop policy if exists "profil_oku" on public.profiles;
create policy "profil_oku" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profil_ekle" on public.profiles;
create policy "profil_ekle" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profil_guncelle" on public.profiles;
create policy "profil_guncelle" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- net_targets ---------------------------------------------------------------
drop policy if exists "hedef_oku" on public.net_targets;
create policy "hedef_oku" on public.net_targets
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "hedef_yaz" on public.net_targets;
create policy "hedef_yaz" on public.net_targets
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- study_logs ----------------------------------------------------------------
drop policy if exists "calisma_oku" on public.study_logs;
create policy "calisma_oku" on public.study_logs
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "calisma_yaz" on public.study_logs;
create policy "calisma_yaz" on public.study_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- mock_exams ----------------------------------------------------------------
drop policy if exists "deneme_oku" on public.mock_exams;
create policy "deneme_oku" on public.mock_exams
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "deneme_yaz" on public.mock_exams;
create policy "deneme_yaz" on public.mock_exams
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- mock_exam_sections --------------------------------------------------------
drop policy if exists "deneme_ders_oku" on public.mock_exam_sections;
create policy "deneme_ders_oku" on public.mock_exam_sections
  for select to authenticated
  using (
    exists (
      select 1 from public.mock_exams e
      where e.id = mock_exam_id and (e.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "deneme_ders_yaz" on public.mock_exam_sections;
create policy "deneme_ders_yaz" on public.mock_exam_sections
  for all to authenticated
  using (
    exists (select 1 from public.mock_exams e where e.id = mock_exam_id and e.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.mock_exams e where e.id = mock_exam_id and e.user_id = auth.uid())
  );

-- ============================================================================
--  KENDİNİ ADMİN YAP
--  Siteye normal şekilde kaydolduktan sonra aşağıdaki satırı e-postanla
--  değiştirip çalıştır. /admin adresi yalnızca bu bayrağa bakar.
-- ============================================================================
-- update public.profiles set is_admin = true where email = 'senin@mailin.com';
