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

## Soru dağılımı

ÖSYM formatına sabit. AYT'de dört test vardır (Matematik 40, Fen 40, TDE–Sosyal-1 40,
Sosyal-2 40 = 160) ve aday puan türüne göre bunlardan **ikisini**, yani 80 soruyu çözer.

**TYT — 120 soru, her alan için ortak**

| Ders | Soru |
|---|---|
| Türkçe | 40 |
| Temel Matematik | 40 |
| Sosyal Bilimler | 20 → Tarih 5, Coğrafya 5, Felsefe 5, Din Kültürü 5 |
| Fen Bilimleri | 20 → Fizik 7, Kimya 7, Biyoloji 6 |

**AYT — 80 soru, alana göre**

| Sayısal | Eşit Ağırlık | Sözel |
|---|---|---|
| Matematik 40 | Matematik 40 | Türk Dili ve Edebiyatı 24 |
| Fizik 14 | Türk Dili ve Edebiyatı 24 | Tarih-1 10 |
| Kimya 13 | Tarih-1 10 | Coğrafya-1 6 |
| Biyoloji 13 | Coğrafya-1 6 | Tarih-2 11 |
| | | Coğrafya-2 11 |
| | | Felsefe Grubu 12 |
| | | Din Kültürü 6 |
| **80** | **80** | **80** |

### İki farklı ders listesi, bilerek

- **Deneme girişi ve hedef netler** yukarıdaki *test* düzeyini kullanır. TYT deneme
  sonuçları Türkçe / Sosyal / Temel Matematik / Fen olarak raporlanır; alt branş neti
  verilmez, dolayısıyla hedefi de o düzeyde koymak gerekir.
- **Günlük soru girişi** branş düzeyindedir: öğrenci "Fen Bilimleri" değil Fizik çalışır.
  TYT için 9 ders listelenir (yukarıdaki alt kırılımlar), AYT için zaten branş bazlıdır.

Sınav tarihi (`SINAV_TARIHI`, `src/lib/yks.ts`) **19 Haziran 2027** olarak sabittir;
öğrenciye sorulmaz. ÖSYM takvimi değişirse yalnızca o satır güncellenir.

## İki ayrı panel

Öğrenci ve eğitmen aynı kod tabanını paylaşır ama **aynı ekranı asla görmez**. Giriş sonrası
yönlendirme `profiles.is_admin` bayrağına bakar; eğitmen `/panel` altına düşerse `/admin`'e,
öğrenci `/admin` altına düşerse `/panel`'e geri gönderilir.

**Öğrenci** — sisteme yalnızca veri girmek için gelir:

1. Kayıt → profil kurulumu (alan + TYT/AYT hedef netleri), bir kez. Sınav tarihi
   sorulmaz, sistemde sabittir.
2. Her girişte ana ekranda **iki buton**: *Günlük çözülen soru sayısını gir* ve
   *Deneme sonucu gir*.
3. Giriş sayfalarında kendi son kayıtlarını görür ve yanlış girdiğini silebilir.
   Deneme sayfasında ayrıca **son 10 denemesinin net grafiğini** ve son 10
   ortalamasını hedef netleriyle karşılaştıran tabloyu görür.
4. **Haftalık programım**: pazartesiden pazara, her gün 3 blok. Her hücrede alanına
   uygun ders seçilir, program kaydedilir ve istenirse görsel olarak indirilir
   (telefonda paylaşım sayfası üzerinden galeriye kaydedilebilir).

**Eğitmen** — `/admin`, öğrenci odaklı:

Ana ekran her öğrenci için bir kart gösterir: son 10 TYT ve AYT net ortalaması, genel
ortalama ve en iyi net, seçili aralıktaki soru/süre/deneme, kaç dersin hedefte kaç dersin
geride olduğu ve toplam net açığı, gidişat (ilk denemelere göre yükseliş/düşüş), son
aktivite tarihi.

Karttaki isme tıklayınca **öğrenci detayı** (`/admin/ogrenci/[id]`): TYT/AYT net özeti
(son 10, genel, en iyi, son deneme), net trendi, haftalık soru ve süre grafikleri, ders
bazlı haftalık soru grafiği, son 10 denemeye göre hedef-mevcut karşılaştırması, ders
dağılımı, tüm denemeler ve tüm günlük kayıtlar.

Tarih aralığı filtresi soru/süre/deneme sayılarını etkiler; **net ortalamaları her zaman
tüm denemeler üzerinden** hesaplanır — "son 10 deneme", seçili aralıkta 2 deneme varsa
2 denemenin ortalaması olmamalı. Excel (.xlsx) dışa aktarma da aynı ekranda.

## Marka varlıkları

Alan adı: **www.yksfollow.com** (`metadataBase`, `src/app/layout.tsx`).

| Dosya | Ne için |
|---|---|
| `public/logo.png` | Uygulama içi işaret — şeffaf zemin, `Logo`/`Wordmark` bileşenleri kullanır |
| `src/app/icon.png` | Sekme ikonu (512²) — beyaz zemin, yuvarlatılmış köşe |
| `src/app/favicon.ico` | `/favicon.ico` isteyen tarayıcılar ve yer imleri (16–256px) |
| `src/app/apple-icon.png` | iOS ana ekran kısayolu (180²) |

Kaynak logoda işaret karenin yalnızca %40'ını kaplıyordu; 16px'lik sekme ikonunda
okunmaz hale geleceği için mürekkep sınırına kırpılıp yeniden ortalandı. Sekme ikonunun
zemini bilerek beyaz: şeffaf bırakılsa koyu sekme temalarında lacivert harfler kaybolurdu.

## Performans notları

- Kimlik doğrulaması `getClaims()` ile yapılıyor, `getUser()` ile değil. Proje ES256
  asimetrik anahtar kullandığı için JWT imzası **yerel** doğrulanıyor; `getUser()`
  her çağrıda Supabase'e gidiyordu. Proxy her isteğe (link prefetch'leri dahil)
  girdiğinden bu, gezinmedeki en büyük gecikme kaynağıydı.
- `oturum()` (`src/lib/db.ts`) React `cache()` ile sarılı. Öncesinde layout ve page
  ayrı ayrı sorgu yapıyordu; her sayfa görüntülemesi 4 ayrı Supabase gidiş-dönüşü
  demekti. Şimdi istek başına tek profil sorgusu kalıyor.
- Her rota segmentinde `loading.tsx` var — geçişlerde iskelet ekran anında görünür.
- Uzun sürebilen bağlantılarda `useLinkStatus` ile spinner
  (`src/components/yuklenen-baglanti.tsx`), form gönderimlerinde `useFormStatus`.
- Fira Sans yalnızca kullanılan 4 ağırlıkla yükleniyor; Fira Code tek bir satır için
  tüm aileyi indirdiğinden kaldırıldı, yerine sistem monosu.
- Recharts sadece `/admin` rotalarında; öğrenci sayfaları grafik paketi indirmez.

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
