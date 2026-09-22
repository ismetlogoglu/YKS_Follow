/**
 * Program hücrelerinin renkleri. Hem DOM'da hem canvas dışa aktarımında
 * kullanıldığı için Tailwind sınıfı değil, düz renk değeri tutuluyor.
 *
 * Görünüm "Soft UI": her ders kendi renginin yarı saydam bir tonu (%12), aynı
 * rengin yarı saydam çerçevesi ve solda dolu bir şerit; yazı o rengin koyu tonu.
 * Yazı, beyaz üzerine düşen bu zeminde WCAG AA (4,5:1) eşiğini rahat geçiyor.
 *
 * Renkler ders ailelerine göre: matematik mavi-mor, dil pembe, fen turkuaz-yeşil,
 * sosyal sarı-yeşil. Turuncu ve kahverengi bilerek yok. Kimya-2 ile Sosyal-1,
 * Biyoloji-2 ile Sosyal-2 aynı rengi paylaşıyor; hiçbir alanda birlikte görünmezler.
 */
export type HucreRengi = {
  zemin: string;
  yazi: string;
  cizgi: string;
  /** Soldaki dolu şerit. */
  serit: string;
  /** Tekrar bloğu: çerçeve kesikli, "yeniden dönülen" iş hissi. */
  kesikli?: boolean;
  /** Deneme bloğu: haftanın çıpası, yazısı kalın. */
  kalin?: boolean;
};

function rgba(hex: string, opaklik: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opaklik})`;
}

/** `ana`: Tailwind 500 tonu (zemin, çerçeve, şerit), `koyu`: 800 tonu (yazı). */
function ton(ana: string, koyu: string): HucreRengi {
  return { zemin: rgba(ana, 0.12), cizgi: rgba(ana, 0.32), serit: ana, yazi: koyu };
}

const RENKLER: Record<string, HucreRengi> = {
  // Matematik ailesi
  p_tyt_mat: ton("#3b82f6", "#1e40af"), // blue
  p_ayt_mat: ton("#6366f1", "#3730a3"), // indigo
  p_geometri: ton("#8b5cf6", "#5b21b6"), // violet
  // Dil ailesi
  p_tyt_turkce: ton("#f43f5e", "#9f1239"), // rose
  p_paragraf: ton("#ec4899", "#9d174d"), // pink
  p_ayt_edebiyat: ton("#d946ef", "#86198f"), // fuchsia
  // Fen ailesi
  p_tyt_fen: ton("#14b8a6", "#115e59"), // teal
  p_fizik2: ton("#0ea5e9", "#075985"), // sky
  p_kimya2: ton("#84cc16", "#3f6212"), // lime
  p_biyoloji2: ton("#22c55e", "#166534"), // green
  // Sosyal ailesi
  p_tyt_sosyal: ton("#eab308", "#854d0e"), // yellow
  p_sos1: ton("#84cc16", "#3f6212"), // lime
  p_sos2: ton("#22c55e", "#166534"), // green
  // Özel bloklar
  p_deneme: { ...ton("#0f172a", "#0f172a"), zemin: rgba("#0f172a", 0.1), kalin: true },
  p_tekrar: { ...ton("#64748b", "#334155"), zemin: rgba("#64748b", 0.08), kesikli: true },
};

/** Boş hücre: şeritsiz, kesikli çerçeve — "buraya ders koyabilirsin". */
export const BOS_HUCRE: HucreRengi = {
  zemin: "#ffffff",
  yazi: "#64748b",
  cizgi: "#cbd5e1",
  serit: "#cbd5e1",
  kesikli: true,
};

export function hucreRengi(dersKey: string | undefined): HucreRengi {
  return (dersKey && RENKLER[dersKey]) || BOS_HUCRE;
}

/** Gün başlıkları: dolu, koyu bantlar — ders hücrelerinin yarı saydam tonlarından ayrışsın. */
export const GUN_RENGI = {
  hafta: "#1e3a8a",
  haftaSonu: "#475569",
  bugun: "#2563eb",
  yazi: "#ffffff",
};

/** Dışa aktarılan görselde kullanılan sabitler. */
export const GORSEL = {
  zemin: "#ffffff",
  baslik: "#1e3a8a",
  soluk: "#475569",
  cizgi: "#dbeafe",
};
