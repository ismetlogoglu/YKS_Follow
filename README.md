# YKS Takip

`YKS_Sayisal_Kocluk_Takip_Cizelgesi.xlsx` çalışma çizelgesinin, çalışan bir backend'i olan web
uygulaması hali. Öğrenciler kaydolur, alanını ve net hedeflerini belirler, her gün çözdüğü soruyu
ve deneme sonuçlarını girer; netler ve haftalık özetler otomatik hesaplanır.

**Kurulum adımları için → [KURULUM.md](KURULUM.md)**

## Excel'den taşınan mantık

| Excel sayfası | Karşılığı |
|---|---|
| Hedef | Profil kurulumu + eğitmenin hedef-mevcut karşılaştırma tablosu |
| Günlük Takip | `/panel/soru` — net ve verim otomatik |
| Deneme TYT / AYT | `/panel/deneme` — sadece D/Y girilir, net ve boş hesaplanır |
| Haftalık Özet | Eğitmenin öğrenci detay sayfası + Excel çıktısı |
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

## İki ayrı panel

Öğrenci ve eğitmen aynı kod tabanını paylaşır ama **aynı ekranı asla görmez**. Giriş sonrası
yönlendirme `profiles.is_admin` bayrağına bakar; eğitmen `/panel` altına düşerse `/admin`'e,
öğrenci `/admin` altına düşerse `/panel`'e geri gönderilir.

**Öğrenci** — sisteme yalnızca veri girmek için gelir:

1. Kayıt → profil kurulumu (alan + TYT/AYT hedef netleri), bir kez.
2. Her girişte ana ekranda **iki buton**: *Günlük çözülen soru sayısını gir* ve
   *Deneme sonucu gir*.
3. Giriş sayfalarında kendi son kayıtlarını görür ve yanlış girdiğini silebilir.
   Grafik ve analiz öğrenciye gösterilmez.

**Eğitmen** — `/admin`:

- Genel metrikler, haftalık toplam soru ve deneme net ortalaması grafikleri
- Öğrenci tablosu; isme tıklayınca **öğrenci detayı** (`/admin/ogrenci/[id]`): net trendi,
  haftalık soru/süre grafikleri, hedef-mevcut karşılaştırması, ders dağılımı ve tüm kayıtlar
- Tarih aralığı filtresi ve Excel (.xlsx) dışa aktarma

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
    panel/                         Öğrenci — iki butonluk giriş ekranı
      soru/ deneme/ ayarlar/
    admin/                         Eğitmen paneli
      ogrenci/[id]/                Öğrenci detayı: grafikler + tüm kayıtlar
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
