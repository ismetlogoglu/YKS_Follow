/**
 * YKS alan/ders tanımları ve net hesabı.
 * Soru sayıları ÖSYM formatına göre sabittir; net = doğru - yanlış/4.
 */

export type Alan = "SAY" | "EA" | "SOZ";
export type SinavTuru = "TYT" | "AYT";

/**
 * YKS tarihi. Öğrenciye sorulmaz — herkes için aynı gün.
 * ÖSYM takvimi değişirse yalnızca bu satır güncellenir.
 */
export const SINAV_TARIHI = "2027-06-19";

export const ALANLAR: { value: Alan; label: string; aciklama: string }[] = [
  { value: "SAY", label: "Sayısal", aciklama: "Matematik, Fizik, Kimya, Biyoloji" },
  { value: "EA", label: "Eşit Ağırlık", aciklama: "Matematik, Edebiyat, Tarih-1, Coğrafya-1" },
  { value: "SOZ", label: "Sözel", aciklama: "Edebiyat, Tarih, Coğrafya, Felsefe, Din" },
];

export const ALAN_ADI: Record<Alan, string> = {
  SAY: "Sayısal",
  EA: "Eşit Ağırlık",
  SOZ: "Sözel",
};

export type Ders = {
  /** Veritabanında saklanan sabit anahtar. Ders adı değişse bile bu değişmez. */
  key: string;
  ad: string;
  soru: number;
};

/**
 * TYT her alan için ortaktır: 120 soru.
 * Bu liste deneme girişi ve hedef netler içindir — TYT deneme sonuçları bu dört
 * test düzeyinde raporlanır, alt branş netleri ayrı verilmez.
 */
export const TYT_DERSLER: Ders[] = [
  { key: "tyt_turkce", ad: "Türkçe", soru: 40 },
  { key: "tyt_sosyal", ad: "Sosyal Bilimler", soru: 20 },
  { key: "tyt_matematik", ad: "Temel Matematik", soru: 40 },
  { key: "tyt_fen", ad: "Fen Bilimleri", soru: 20 },
];

/**
 * Günlük çalışma kaydı için TYT dersleri — burada branş ayrımı gerekir.
 * Öğrenci "Fen Bilimleri" çalışmaz, Fizik çalışır. Soru sayıları ÖSYM'nin
 * test içi dağılımı: Sosyal 20 = Tarih 5 + Coğrafya 5 + Felsefe 5 + Din 5,
 * Fen 20 = Fizik 7 + Kimya 7 + Biyoloji 6.
 */
export const TYT_CALISMA_DERSLERI: Ders[] = [
  { key: "tyt_turkce", ad: "Türkçe", soru: 40 },
  { key: "tyt_matematik", ad: "Temel Matematik", soru: 40 },
  { key: "tyt_tarih", ad: "Tarih", soru: 5 },
  { key: "tyt_cografya", ad: "Coğrafya", soru: 5 },
  { key: "tyt_felsefe", ad: "Felsefe", soru: 5 },
  { key: "tyt_din", ad: "Din Kültürü ve Ahlak Bilgisi", soru: 5 },
  { key: "tyt_fizik", ad: "Fizik", soru: 7 },
  { key: "tyt_kimya", ad: "Kimya", soru: 7 },
  { key: "tyt_biyoloji", ad: "Biyoloji", soru: 6 },
];

/** AYT alana göre değişir; her alanda toplam 80 soru. */
export const AYT_DERSLER: Record<Alan, Ders[]> = {
  SAY: [
    { key: "ayt_matematik", ad: "Matematik", soru: 40 },
    { key: "ayt_fizik", ad: "Fizik", soru: 14 },
    { key: "ayt_kimya", ad: "Kimya", soru: 13 },
    { key: "ayt_biyoloji", ad: "Biyoloji", soru: 13 },
  ],
  EA: [
    { key: "ayt_matematik", ad: "Matematik", soru: 40 },
    { key: "ayt_edebiyat", ad: "Türk Dili ve Edebiyatı", soru: 24 },
    { key: "ayt_tarih1", ad: "Tarih-1", soru: 10 },
    { key: "ayt_cografya1", ad: "Coğrafya-1", soru: 6 },
  ],
  SOZ: [
    { key: "ayt_edebiyat", ad: "Türk Dili ve Edebiyatı", soru: 24 },
    { key: "ayt_tarih1", ad: "Tarih-1", soru: 10 },
    { key: "ayt_cografya1", ad: "Coğrafya-1", soru: 6 },
    { key: "ayt_tarih2", ad: "Tarih-2", soru: 11 },
    { key: "ayt_cografya2", ad: "Coğrafya-2", soru: 11 },
    { key: "ayt_felsefe", ad: "Felsefe Grubu", soru: 12 },
    { key: "ayt_din", ad: "Din Kültürü ve Ahlak Bilgisi", soru: 6 },
  ],
};

/** Deneme girişi ve hedef netler için ders listesi. */
export function dersler(alan: Alan, sinav: SinavTuru): Ders[] {
  return sinav === "TYT" ? TYT_DERSLER : AYT_DERSLER[alan];
}

/** Günlük soru girişi için ders listesi — TYT'de branşlara ayrılır. */
export function calismaDersleri(alan: Alan, sinav: SinavTuru): Ders[] {
  return sinav === "TYT" ? TYT_CALISMA_DERSLERI : AYT_DERSLER[alan];
}

export function tumDersler(alan: Alan): Ders[] {
  return [...TYT_DERSLER, ...AYT_DERSLER[alan]];
}

/**
 * Anahtar → ad eşlemesi. Öğrenci alanını değiştirse veya bir ders listeden
 * çıksa bile eski kayıtlar okunabilir kalsın diye tüm listeleri kapsar.
 */
const TUM_DERSLER_DUZ: Ders[] = [
  ...TYT_DERSLER,
  ...TYT_CALISMA_DERSLERI,
  ...AYT_DERSLER.SAY,
  ...AYT_DERSLER.EA,
  ...AYT_DERSLER.SOZ,
];

const TUM_DERS_ADLARI: Record<string, string> = Object.fromEntries(
  TUM_DERSLER_DUZ.map((d) => [d.key, d.ad]),
);

const TUM_SORU_SAYILARI: Record<string, number> = Object.fromEntries(
  TUM_DERSLER_DUZ.map((d) => [d.key, d.soru]),
);

export function dersAdi(key: string): string {
  return TUM_DERS_ADLARI[key] ?? key;
}

export function dersSoruSayisi(key: string): number {
  return TUM_SORU_SAYILARI[key] ?? 0;
}

/** Ders anahtarlarını sınav kağıdındaki sıraya göre dizmek için. Bilinmeyen ders sona düşer. */
const DERS_SIRASI: Record<string, number> = Object.fromEntries(
  [...new Set(TUM_DERSLER_DUZ.map((d) => d.key))].map((key, i) => [key, i]),
);

export function dersSirasi(key: string): number {
  return DERS_SIRASI[key] ?? Number.MAX_SAFE_INTEGER;
}

export function toplamSoru(alan: Alan, sinav: SinavTuru): number {
  return dersler(alan, sinav).reduce((t, d) => t + d.soru, 0);
}

/** Excel'deki formülün aynısı: Net = Doğru − (Yanlış / 4) */
export function net(dogru: number, yanlis: number): number {
  return dogru - yanlis / 4;
}

/** Grafik ve tablolarda 2 basamak, gereksiz sıfırlar atılmış halde. */
export function netYaz(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return (Math.round(n * 100) / 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

/** Verim: soru / saat. Excel'deki K sütunu. */
export function verim(soru: number, dakika: number | null | undefined): number | null {
  if (!dakika || dakika <= 0) return null;
  return Math.round((soru / (dakika / 60)) * 10) / 10;
}

/** Varsayılan hedef net önerisi — soru sayısının %85'i, öğrenci sonra düzenler. */
export function varsayilanHedef(soru: number): number {
  return Math.round(soru * 0.85 * 2) / 2;
}

/** Pazartesi başlangıçlı hafta anahtarı (YYYY-MM-DD). */
export function haftaBasi(tarih: Date): Date {
  const d = new Date(Date.UTC(tarih.getFullYear(), tarih.getMonth(), tarih.getDate()));
  const gun = d.getUTCDay(); // 0 = Pazar
  const fark = gun === 0 ? -6 : 1 - gun;
  d.setUTCDate(d.getUTCDate() + fark);
  return d;
}

const ikiHane = (n: number) => String(n).padStart(2, "0");

/**
 * haftaBasi'nın döndürdüğü UTC'ye normalize edilmiş tarihler için.
 * Yerel bir Date'e uygulanmamalı — UTC+3'te gün bir geri kayar.
 */
export function isoTarih(d: Date): string {
  return `${d.getUTCFullYear()}-${ikiHane(d.getUTCMonth() + 1)}-${ikiHane(d.getUTCDate())}`;
}

/** Kullanıcının takvimindeki günü yazar; UTC kaymasından etkilenmez. */
export function yerelIso(d: Date): string {
  return `${d.getFullYear()}-${ikiHane(d.getMonth() + 1)}-${ikiHane(d.getDate())}`;
}

export function bugun(): string {
  return yerelIso(new Date());
}

export function tarihYaz(iso: string): string {
  const [y, m, g] = iso.split("-").map(Number);
  return new Date(y, m - 1, g).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function kisaTarih(iso: string): string {
  const [y, m, g] = iso.split("-").map(Number);
  return new Date(y, m - 1, g).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}
