# Kurulum

Sıfırdan çalışır hale getirmek ~15 dakika. Sırayla git.

> **Bu depodaki kurulum zaten yapıldı.** `.env.local` dolduruldu ve Supabase şeması
> çalıştırıldı (1–4. adımlar tamam). Sende kalanlar: **5. adım** (kendini admin yap) ve
> **8. adım** (Redirect URL'ler — bu eksikse e-posta doğrulama linki geri dönemez).
> Aşağısı sıfırdan kuracak biri için tam referans.
>
> ⚠️ **Haftalık program için yeni tablo gerekiyor.** Supabase > SQL Editor'da
> [`supabase/migrations/001_haftalik_program.sql`](supabase/migrations/001_haftalik_program.sql)
> dosyasını çalıştır. Bu yapılmadan program sayfası kaydetmez.

---

## 0. Bana ne vermen gerekiyor?

**Hiçbir gizli anahtar vermene gerek yok.** Aşağıdaki değerleri sen kendi bilgisayarındaki
`.env.local` dosyasına yazacaksın; ben onlara erişmiyorum ve dosya git'e de gitmiyor
(`.gitignore` içinde `.env*` var).

| Değer | Nerede? | Gizli mi? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | Hayır, herkese açık |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Aynı sayfa, "anon public" | Hayır, tarayıcıda görünmesi normal |
| `service_role` anahtarı | Aynı sayfa | **EVET — kimseyle paylaşma, bu projede hiç kullanılmıyor** |

`anon` anahtarının tarayıcıda görünmesi tasarım gereğidir; veriyi koruyan şey anahtar değil,
veritabanındaki **RLS (Row Level Security)** politikalarıdır. `schema.sql` bu politikaları
kuruyor: her öğrenci yalnızca kendi satırlarını görebiliyor.

Bu proje bilerek `service_role` anahtarına **ihtiyaç duymayacak** şekilde yazıldı — yönetici
yetkisi de RLS içindeki `is_admin()` fonksiyonuyla çözülüyor. Yani sızdırılacak bir sunucu
anahtarı yok.

---

## 1. Supabase projesi aç

1. [supabase.com](https://supabase.com) → **New project**
2. Bölge olarak **Frankfurt (eu-central-1)** seç — Türkiye'ye en yakın olanı.
3. Veritabanı şifresini bir yere kaydet (bu şifreye günlük kullanımda ihtiyacın olmayacak).

## 2. Tabloları oluştur

Supabase panelinde **SQL Editor → New query**. Bu depodaki
[`supabase/schema.sql`](supabase/schema.sql) dosyasının **tamamını** yapıştır ve **Run**.

Bu tek dosya şunları kurar:

- `profiles` — alan (SAY/EA/SÖZ), hedef üniversite/bölüm/sıralama, sınav tarihi
- `net_targets` — ders bazlı hedef netler
- `study_logs` — günlük soru kayıtları (`net` sütunu veritabanında otomatik hesaplanır)
- `mock_exams` + `mock_exam_sections` — deneme sonuçları
- `mock_exam_totals` — deneme toplamlarını veren görünüm
- Kayıt olan her kullanıcıya otomatik profil açan tetikleyici
- Tüm tablolarda RLS politikaları

Dosya tekrar çalıştırılabilir; ikinci kez çalıştırırsan var olan veriyi bozmaz.

## 3. Anahtarları projeye koy

Proje kökünde `.env.local` adında bir dosya oluştur:

```bash
cp .env.example .env.local
```

Sonra Supabase > **Project Settings → API** sayfasındaki iki değeri içine yaz:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 4. Çalıştır

```bash
npm install
```

```bash
npm run dev
```

http://localhost:3000 açılır. Kaydol → profil kurulumunu tamamla → panel.

---

## 5. Kendini admin yap

Önce siteden **normal şekilde kaydol**. Sonra Supabase SQL Editor'da:

```sql
update public.profiles set is_admin = true where email = 'senin@mailin.com';
```

Sayfayı yenile; sağ üstte **Admin** butonu çıkar, `/admin` açılır.

Admin panelinde: toplam kullanıcı, haftalık soru, deneme net ortalamaları, öğrenci tablosu,
tarih aralığı filtresi ve **Excel olarak indir** butonu.

---

## 6. E-posta doğrulama (isteğe bağlı ama önerilir)

Supabase varsayılan olarak e-posta doğrulaması ister. Test ederken kapatmak istersen:

**Authentication → Sign In / Providers → Email → Confirm email** kapalı.

Açık bırakırsan kayıt sonrası kullanıcıya doğrulama linki gider; site bunu zaten doğru şekilde
karşılıyor (`/auth/callback`).

> Supabase'in ücretsiz planında e-posta gönderim limiti saatte birkaç adettir. Gerçek
> öğrencilerle kullanacaksan **Authentication → Emails → SMTP Settings** altından kendi SMTP'ni
> (Resend, Postmark, Gmail vb.) bağla.

## 7. Google ile giriş (isteğe bağlı)

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
   → **Create Credentials → OAuth client ID → Web application**
2. **Authorized redirect URIs** kısmına Supabase'in verdiği callback adresini yapıştır:
   `https://<proje-ref>.supabase.co/auth/v1/callback`
3. Aldığın **Client ID** ve **Client Secret**'ı Supabase → **Authentication → Sign In / Providers
   → Google** altına gir ve etkinleştir.

Bu adımı yapmazsan "Google ile devam et" butonu hata döndürür; e-posta/şifre girişi etkilenmez.

## 8. Yönlendirme adresleri

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (yayına aldığında kendi alan adın)
- **Redirect URLs** listesine ekle:
  - `http://localhost:3000/auth/callback`
  - `https://alanadin.com/auth/callback`

Bu ikisi eksikse Google girişi ve e-posta doğrulama linki geri dönemez.

---

## 9. Yayına alma (Vercel)

```bash
npx vercel
```

Vercel panelinde **Settings → Environment Variables** altına üç değer gir:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` → `https://alanadin.com`

`NEXT_PUBLIC_SITE_URL` yalnızca üretimde gerekli: Google ve e-posta doğrulama
bağlantılarının hangi adrese döneceğini belirler. Ardından 8. adımdaki Redirect URL'lere
gerçek alan adını eklemeyi unutma.

---

## Sorun giderme

| Belirti | Sebep |
|---|---|
| "Supabase ayarları eksik" hatası | `.env.local` yok veya değerler boş. 3. adım. |
| Kayıt oluyor ama profil açılmıyor | `schema.sql` çalıştırılmamış (tetikleyici yok). 2. adım. |
| Panelde "satır bulunamadı" / boş liste | RLS politikaları eksik; `schema.sql`'i baştan çalıştır. |
| `/admin` seni panele atıyor | `is_admin` bayrağın `false`. 5. adım. |
| Google butonu hata veriyor | Google sağlayıcısı Supabase'de açık değil. 7. adım. |
| Doğrulama linki `localhost`'a dönüyor | Site URL / Redirect URLs ayarı. 8. adım. |
