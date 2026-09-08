/**
 * Program hücrelerinin renkleri. Hem DOM'da hem canvas dışa aktarımında
 * kullanıldığı için Tailwind sınıfı değil, düz hex tutuluyor.
 *
 * Renk ders başına değil ders grubuna göre: 11 ayrı renk haftalık tabloyu
 * okunmaz hale getirirdi. Grup ayrımı (TYT / AYT / blok) tek bakışta yeterli.
 */
export type HucreRengi = { zemin: string; yazi: string; cizgi: string };

const TYT: HucreRengi = { zemin: "#e9eef6", yazi: "#1e40af", cizgi: "#c7d7f0" };
const AYT: HucreRengi = { zemin: "#fdf3e3", yazi: "#b45309", cizgi: "#f0dcb8" };
const DENEME: HucreRengi = { zemin: "#eaf7ee", yazi: "#15803d", cizgi: "#c2e6cd" };
const TEKRAR: HucreRengi = { zemin: "#f1f5f9", yazi: "#475569", cizgi: "#d9e1ea" };

// Boş hücrenin tiresi de etkileşimli bir kontrolün görünen içeriği; #94a3b8
// beyaz üzerinde 2,56:1 kalıyordu.
export const BOS_HUCRE: HucreRengi = { zemin: "#ffffff", yazi: "#64748b", cizgi: "#e6ecf4" };

export function hucreRengi(dersKey: string | undefined): HucreRengi {
  if (!dersKey) return BOS_HUCRE;
  if (dersKey === "p_deneme") return DENEME;
  if (dersKey === "p_tekrar") return TEKRAR;
  return dersKey.startsWith("p_tyt_") ? TYT : AYT;
}

/** Dışa aktarılan görselde kullanılan sabitler. */
export const GORSEL = {
  zemin: "#ffffff",
  baslik: "#1e3a8a",
  // Hafta sonu başlığında gri zemine düştüğü için bir ton koyu: #64748b orada
  // 4,34:1 veriyordu.
  soluk: "#475569",
  cizgi: "#dbeafe",
  gunZemin: "#f8fafc",
  haftaSonuZemin: "#f1f5f9",
};
