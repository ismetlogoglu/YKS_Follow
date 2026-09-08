/**
 * Program hücrelerinin renkleri. Hem DOM'da hem canvas dışa aktarımında
 * kullanıldığı için Tailwind sınıfı değil, düz hex tutuluyor.
 *
 * Her dersin kendi rengi var. Renkler bir alanda yan yana gelenler ayrışsın diye
 * renk çemberine yayıldı; hepsi açık zemin + koyu yazı düzeninde ve WCAG AA
 * (4,5:1) eşiğini geçiyor. Deneme tek istisna: dolu lacivert, çünkü haftanın
 * çıpası odur ve tabloda öne çıkması gerekir.
 */
export type HucreRengi = { zemin: string; yazi: string; cizgi: string };

const RENKLER: Record<string, HucreRengi> = {
  p_tyt_mat: { zemin: "#eff6ff", yazi: "#1d4ed8", cizgi: "#c8dcfa" },
  p_tyt_turkce: { zemin: "#fff1f2", yazi: "#be123c", cizgi: "#fbcfd5" },
  p_tyt_fen: { zemin: "#f0fdfa", yazi: "#0f766e", cizgi: "#b8e6df" },
  p_tyt_sosyal: { zemin: "#fffbeb", yazi: "#b45309", cizgi: "#f4dfb0" },
  p_paragraf: { zemin: "#fefce8", yazi: "#a16207", cizgi: "#eee3ab" },
  p_ayt_mat: { zemin: "#eef2ff", yazi: "#4338ca", cizgi: "#cdd4f8" },
  p_geometri: { zemin: "#faf5ff", yazi: "#7e22ce", cizgi: "#e4d3f7" },
  p_fizik2: { zemin: "#f0f9ff", yazi: "#0369a1", cizgi: "#bfe0f5" },
  p_kimya2: { zemin: "#fff7ed", yazi: "#c2410c", cizgi: "#f7d7bb" },
  p_biyoloji2: { zemin: "#f0fdf4", yazi: "#15803d", cizgi: "#bfe6cc" },
  p_ayt_edebiyat: { zemin: "#fdf2f8", yazi: "#be185d", cizgi: "#f7cee2" },
  p_sos1: { zemin: "#fdf4ff", yazi: "#a21caf", cizgi: "#f0d0f5" },
  p_sos2: { zemin: "#f5f3ff", yazi: "#6d28d9", cizgi: "#dcd3f9" },
  p_deneme: { zemin: "#1e3a8a", yazi: "#ffffff", cizgi: "#1e3a8a" },
  p_tekrar: { zemin: "#f1f5f9", yazi: "#475569", cizgi: "#d9e1ea" },
};

// Boş hücrenin tiresi de etkileşimli bir kontrolün görünen içeriği; daha soluk
// bir gri (#94a3b8) beyaz üzerinde 2,56:1 kalıyordu.
export const BOS_HUCRE: HucreRengi = { zemin: "#ffffff", yazi: "#64748b", cizgi: "#e2e8f0" };

export function hucreRengi(dersKey: string | undefined): HucreRengi {
  return (dersKey && RENKLER[dersKey]) || BOS_HUCRE;
}

/** Dışa aktarılan görselde kullanılan sabitler. */
export const GORSEL = {
  zemin: "#ffffff",
  baslik: "#1e3a8a",
  // Hafta sonu başlığında gri zemine düştüğü için bir ton koyu.
  soluk: "#475569",
  cizgi: "#dbeafe",
  gunZemin: "#f8fafc",
  haftaSonuZemin: "#f1f5f9",
};
