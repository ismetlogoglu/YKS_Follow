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
| Haftalık Program | `/panel/program` — 7 gün × 3 blok, kaydedilir ve görsel olarak indirilir |

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
  TYT için yukarıdaki alt kırılımlar listelenir, AYT için zaten branş bazlıdır. Tek istisna
  **Sosyal Bilimler**: karma sosyal testi çözen öğrenci için ayrı bir seçenek olarak da
  duruyor ve deneme listesiyle aynı anahtarı (`tyt_sosyal`) kullanıyor, yani analizlerde
  tek ders olarak görünüyor.

Sınav tarihi (`SINAV_TARIHI`, `src/lib/yks.ts`) **19 Haziran 2027** olarak sabittir;
öğrenciye sorulmaz. ÖSYM takvimi değişirse yalnızca o satır güncellenir.

## İki ayrı panel

Öğrenci ve eğitmen aynı kod tabanını paylaşır ama **aynı ekranı asla görmez**. Giriş sonrası
yönlendirme `profiles.is_admin` bayrağına bakar; eğitmen `/panel` altına düşerse `/admin`'e,
öğrenci `/admin` altına düşerse `/panel`'e geri gönderilir.

**Öğrenci** — sisteme yalnızca veri girmek için gelir:

1. Kayıt → profil kurulumu (alan + TYT/AYT hedef netleri), bir kez. Sınav tarihi
   sorulmaz, sistemde sabittir.
2. Her girişte ana ekranda **dört buton**: *Günlük çözülen soru sayısını gir*,
   *Deneme sonucu gir*, *Haftalık programım* ve *Analizlerim*.
3. Giriş sayfalarında kendi son kayıtlarını görür ve yanlış girdiğini silebilir.
   Deneme sayfasında ayrıca **son 10 denemesinin net grafiğini** ve son 10
   ortalamasını hedef netleriyle karşılaştıran tabloyu görür.
4. **Haftalık programım**: pazartesiden pazara, her gün 3 blok. Her hücrede alanına
   uygun ders seçilir, program kaydedilir ve istenirse görsel olarak indirilir
   (telefonda paylaşım sayfası üzerinden galeriye kaydedilebilir).
5. **Analizlerim** (`/panel/analiz`): toplam ve bu hafta çözülen soru; haftanın 7 günü
   için çubuk + çizgi grafik (önceki haftalara geçilebilir, "Tüm dersler" ya da tek ders
   seçilebilir); ders ders toplam çözülen soru; deneme netlerinin çizgi grafiği (TYT/AYT
   toplamı ya da Türkçe, Sosyal, Temel Matematik, Fen gibi tek test seçilerek).

**Eğitmen** — `/admin`, öğrenci odaklı:

Ana ekran her öğrenci için bir kart gösterir: son 10 TYT ve AYT net ortalaması, genel
ortalama ve en iyi net, seçili aralıktaki soru/süre/deneme, kaç dersin hedefte kaç dersin
geride olduğu ve toplam net açığı, gidişat (ilk denemelere göre yükseliş/düşüş), son
aktivite tarihi.

Karttaki isme tıklayınca **öğrenci detayı** (`/admin/ogrenci/[id]`): TYT/AYT net özeti
(son 10, genel, en iyi, son deneme), öğrencinin *Analizlerim* ekranındaki grafiklerin
aynısı (`AnalizPaneli` ortak bileşen), son 12 haftanın soru, süre ve ders bazlı soru
grafikleri, son 10 denemeye göre hedef-mevcut karşılaştırması, tüm denemeler ve tüm
günlük kayıtlar. Tablodaki uzun notlar kısaltılmış görünür; üzerine tıklayınca tam metin
bir balonda açılır.

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

**Coğrafya en büyük etken.** Supabase projesi Seul'de (`ap-northeast-2`), öğrenciler
Türkiye'de. Vercel varsayılan olarak fonksiyonları Washington'da (`iad1`) çalıştırıyordu;
her sayfa isteği Türkiye → Washington → Seul → geri yolunu izliyordu ve her veritabanı
sorgusu Washington ↔ Seul arasında ~200 ms sürüyordu.

- `vercel.json` → `"regions": ["icn1"]`: sunucu kodu veritabanının yanında çalışıyor,
  sorgu başına gecikme ~200 ms'den ~2 ms'ye iniyor. Kalıcı çözüm veritabanını
  Frankfurt'a taşıyıp bölgeyi `fra1` yapmak — adımlar: [supabase/FRANKFURT_TASIMA.md](supabase/FRANKFURT_TASIMA.md).
- **Her sayfa tek veritabanı turu.** `profilVeVeri()` (`src/lib/db.ts`) profil kontrolünü
  ve sayfanın kendi sorgusunu paralel çalıştırıyor; kimlik `getClaims()` ile yerel
  doğrulandığı için veri sorgusu profili beklemek zorunda değil.
- **Denemeler bölümleriyle tek sorguda** (`DENEME_SECIMI`, PostgREST gömülü seçim).
  Eskiden önce toplamlar, sonra bölümler ayrı ayrı çekiliyordu.
- **Eğitmen paneli 5 turdan 1'e, öğrenci detayı 4 turdan 1'e** indi. "Tüm denemeler"
  sorgusu tarih aralığındakileri de kapsadığı için aralık ayrıca sorgulanmıyor.
- **Kaydetme aksiyonları** ağa giden `getUser()` yerine `oturum()` / `oturumKimligi()`
  kullanıyor. Profil kaydı 4 sıralı yazmadan 1 paralel tura indi.
- `oturum()` React `cache()` ile sarılı; layout ve page aynı profili tekrar sorgulamıyor.
- Her rota segmentinde `loading.tsx` iskeleti, bağlantılarda `useLinkStatus`, formlarda
  `useFormStatus` göstergesi var.
- Recharts yalnızca grafik içeren rotalarda (`/admin`, `/panel/deneme`, `/panel/analiz`);
  soru girişi ve program sayfaları grafik paketi indirmez.

## Eski iPhone desteği

Next 16 varsayılan olarak Safari 16.4+ için derler. Derlenen kodda `class { static { … } }`
blokları kalıyordu; Safari 16.4 öncesi bu sözdizimini okuyamayınca React hiç
canlanmıyordu. Formlar tarayıcının kendi gönderimiyle çalışmaya devam ettiği için sorun
sadece JavaScript'e bağlı düğmelerde (TYT/AYT seçimi) görünüyordu.

- `package.json` → `browserslist` hedefi **iOS / Safari 14**'e indirildi; derleme artık bu
  blokları dönüştürüyor. Kontrol: `.next/static/chunks` içinde `static {` geçmemeli.
- TYT/AYT seçici aynı zamanda `?sinav=AYT` bağlantısı. JavaScript çalışmasa bile sayfa
  sunucudan AYT dersleriyle yeniden gelir.
- Tarih alanlarının varsayılanı ve üst sınırı sunucunun saatine değil Türkiye takvimine
  göre (`turkiyeBugun()`); gece 00:00–03:00 arası "bugün" seçilemiyordu.

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
    panel/                         Öğrenci — dört butonluk giriş ekranı
      soru/ deneme/ program/ analiz/ ayarlar/
    admin/                         Eğitmen paneli
      ogrenci/[id]/                Öğrenci detayı: grafikler + tüm kayıtlar
      export/                      .xlsx indirme
  components/                      UI kiti, formlar, grafikler
  lib/
    yks.ts                         Alan/ders tanımları, net hesabı
    istatistik.ts                  Haftalık özet, trend, hedef karşılaştırma
    analiz.ts                      Analiz ekranının veri biçimi (öğrenci + eğitmen ortak)
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
