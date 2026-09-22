# Veritabanını Frankfurt'a taşıma

## Neden

Supabase projesi **Seul'de** (`ap-northeast-2`). Öğrenciler Türkiye'de. Türkiye'den
ölçülen gidiş-dönüş süreleri:

| Bölge | Süre |
|---|---|
| Frankfurt (`eu-central-1` / Vercel `fra1`) | ~51 ms |
| Washington (`us-east-1` / Vercel `iad1`) | ~136 ms |
| Seul (`ap-northeast-2` / Vercel `icn1`) | ~321 ms |

Şu an sunucu kodu veritabanının yanında (`vercel.json` → `icn1`) çalışıyor; bu
sorguları hızlandırdı ama her istek yine Türkiye ↔ Seul arasını bir kez geçiyor.
Veritabanı ve sunucu Frankfurt'ta olursa o yol ~6 kat kısalır.

**Beklenen kazanç:** sayfa yüklenmesi ve kaydetme ~400 ms → ~120 ms.

## Güvenlik ağı

Eski proje taşıma bitene ve yeni proje doğrulanana kadar **silinmez**. Bir şey
ters giderse Vercel'deki iki ortam değişkenini eski değerlere döndürmek yeter.

## 0. Araçlar

```bash
brew install libpq && brew link --force libpq
```

`pg_dump` ve `psql` gelir. (Supabase'in kendi CLI yolu Docker istiyor; bu yol istemiyor.)

## 1. Yeni projeyi aç

Supabase → **New project** → Region: **Central EU (Frankfurt)**. Veritabanı şifresini kaydet.

## 2. Şemayı kur

Yeni projede SQL Editor'da sırayla çalıştır:

1. `supabase/schema.sql`
2. `supabase/migrations/001_haftalik_program.sql`

## 3. Veriyi taşı

İki projenin de bağlantı dizesi: **Project Settings → Database → Connection string →
Session pooler**. (Doğrudan bağlantı yalnızca IPv6 destekliyor, ev ağlarında çoğu zaman
çalışmıyor; Session pooler IPv4.) `[YOUR-PASSWORD]` kısmına o projenin şifresini yaz.

```bash
ESKI='postgresql://postgres.ESKI_REF:SIFRE@...pooler.supabase.com:5432/postgres'
```

```bash
YENI='postgresql://postgres.YENI_REF:SIFRE@...pooler.supabase.com:5432/postgres'
```

Eski projeden veriyi al:

```bash
pg_dump "$ESKI" --data-only --no-owner --no-privileges \
  --table=auth.users --table=auth.identities \
  --table=public.profiles --table=public.net_targets \
  --table=public.study_logs --table=public.mock_exams \
  --table=public.mock_exam_sections --table=public.weekly_schedule \
  --file=veri.sql
```

Yeni projeye yükle (tetikleyiciler kapalıyken, tek işlemde — hata olursa hiçbir şey yazılmaz):

```bash
psql "$YENI" --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica' \
  --file veri.sql
```

Şifre hash'leri de taşındığı için öğrenciler **aynı şifreyle** girebilir; yalnızca bir
kez yeniden giriş yapmaları gerekir (yeni projenin imza anahtarı farklı).

## 4. Yeni projeyi ayarla

Supabase → **Authentication**:

- **URL Configuration** → Site URL: `https://www.yksfollow.com`,
  Redirect URLs: `https://www.yksfollow.com/auth/callback` ve `http://localhost:3000/auth/callback`
- **Sign In / Providers → Email** → "Confirm email" eski projedekiyle aynı olsun
- SMTP veya Google girişi kurduysan onları da tekrar gir

## 5. Uygulamayı yeni projeye bağla

Vercel → Settings → Environment Variables ve yerelde `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` → yeni proje adresi, **yalnızca kök**:
  `https://YENI_REF.supabase.co`. Panelde gösterilen REST adresi
  (`…supabase.co/rest/v1/`) değil. O girildiğinde tüm istekler `/rest/v1/auth/v1/…`
  yoluna gidiyordu ve kimse giriş yapamıyordu; uygulama artık adresi köküne indiriyor
  (`projeAdresi()`, `src/lib/supabase/ayarlar.ts`) ama değişkende doğru değer dursun.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → yeni projenin publishable anahtarı

`vercel.json` içinde `"icn1"` → `"fra1"`. Commit + push.

> Sırası önemli: veritabanı Frankfurt'a geçmeden `fra1` yapılırsa site **daha da
> yavaşlar** (Frankfurt'taki sunucu her sorguda Seul'e gider).

## 6. Doğrula, sonra eskiyi kapat

İki projenin de SQL Editor'ında aynı sorguyu çalıştır; sayılar aynı olmalı. Yeni
projede eksik varsa, döküm alındıktan sonra eski projeye yazılmış kayıtlar demektir.

```sql
select 'auth.users' as tablo, count(*) from auth.users
union all select 'profiles',           count(*) from public.profiles
union all select 'net_targets',        count(*) from public.net_targets
union all select 'study_logs',         count(*) from public.study_logs
union all select 'mock_exams',         count(*) from public.mock_exams
union all select 'mock_exam_sections', count(*) from public.mock_exam_sections
union all select 'weekly_schedule',    count(*) from public.weekly_schedule;
```

Sonra birkaç öğrenciyle giriş + soru + deneme girişi dene. Her şey yerindeyse:

- `veri.sql` dosyasını sil — öğrencilerin e-postalarını ve şifre özetlerini içeriyor.
- Yerel `.env.local` da yeni projeyi göstersin.
- Eski Seul projesini Supabase panelinden duraklat/sil.
