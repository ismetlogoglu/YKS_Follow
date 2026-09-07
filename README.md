# YKS Takip

`YKS_Sayisal_Kocluk_Takip_Cizelgesi.xlsx` çalışma çizelgesinin, çalışan bir backend'i olan web
uygulaması hali. Öğrenciler kaydolur, alanını ve net hedeflerini belirler, her gün çözdüğü soruyu
ve deneme sonuçlarını girer; netler ve haftalık özetler otomatik hesaplanır.

**Kurulum adımları için → [KURULUM.md](KURULUM.md)**

## Excel'den taşınan mantık

| Excel sayfası | Karşılığı |
|---|---|
| Hedef | Profil kurulumu + `/panel` hedef-mevcut karşılaştırma tablosu |
| Günlük Takip | `/panel/soru` — net ve verim otomatik |
| Deneme TYT / AYT | `/panel/deneme` — sadece D/Y girilir, net ve boş hesaplanır |
| Haftalık Özet | `/panel/gelisim` haftalık tablo + grafikler |
| Konu TYT / AYT | Günlük girişteki serbest "Konu" alanı |
| Haftalık Program | Kapsam dışı (istenmedi) |

Net formülü her yerde aynı: **Net = Doğru − Yanlış / 4**. Bu hesap veritabanında
`generated always as` sütunu olarak duruyor, yani uygulama koduyla veri asla çelişemez.

Soru sayıları ÖSYM formatına sabit:

- **TYT** (herkes): Türkçe 40, Sosyal 20, Temel Matematik 40, Fen 20 → 120
- **AYT Sayısal**: Matematik 40, Fizik 14, Kimya 13, Biyoloji 13 → 80
- **AYT Eşit Ağırlık**: Matematik 40, Edebiyat 24, Tarih-1 10, Coğrafya-1 6 → 80
- **AYT Sözel**: Edebiyat 24, Tarih-1 10, Coğrafya-1 6, Tarih-2 11, Coğrafya-2 11,
  Felsefe 12, Din Kültürü 6 → 80

## Akış

**Öğrenci:** kayıt → profil kurulumu (alan + hedefler) → panel → günlük soru / deneme girişi →
gelişim grafikleri.

**Yönetici:** `/admin` → genel metrikler, öğrenci tablosu, tarih aralığı filtresi,
Excel (.xlsx) dışa aktarma.

## Teknik

- **Next.js 16** (App Router, Server Actions, Turbopack) + **React 19** + **TypeScript**
- **Supabase** — Postgres + Auth (e-posta/şifre ve Google)
- **Tailwind CSS v4** — tasarım token'ları `src/app/globals.css` içinde
- **Recharts** grafikler, **ExcelJS** dışa aktarma, **Zod** doğrulama

Yetkilendirme tamamen **RLS** ile: her sorgu öğrencinin kendi satırlarıyla sınırlı, yönetici
erişimi `is_admin()` fonksiyonundan geçiyor. Uygulama `service_role` anahtarı kullanmıyor.

Sunucu tarafı doğrulama, istemciden gelen ders anahtarına güvenmez — ders listesi her zaman
kullanıcının profilindeki alandan yeniden türetilir.

## Dizin yapısı

```
src/
  app/
    (auth)/giris, (auth)/kayit    Giriş ve kayıt
    auth/                          Server actions + OAuth callback
    kurulum/                       İlk profil kurulumu (2 adım)
    panel/                         Öğrenci paneli
      soru/ deneme/ gelisim/ ayarlar/
    admin/                         Yönetici paneli
      export/                      .xlsx indirme
  components/                      UI kiti, formlar, grafikler
  lib/
    yks.ts                         Alan/ders tanımları, net hesabı
    istatistik.ts                  Haftalık özet, trend, hedef karşılaştırma
    db.ts, admin.ts                Veri erişimi
    supabase/                      İstemciler
  proxy.ts                         Oturum tazeleme + rota koruması
supabase/schema.sql                Tablolar, görünümler, RLS, tetikleyiciler
```

## Komutlar

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```
