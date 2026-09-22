import type { CalismaKaydi, DenemeDers, DenemeToplam } from "./db";
import type { SinavTuru } from "./yks";

/**
 * Analiz ekranına giden en küçük veri. İstemci bileşenine ham satırlar yerine
 * bunlar gidiyor: hafta/ders seçimleri tarayıcıda yapıldığı için tüm kayıtlar
 * gerekli, ama yalnızca grafiğin kullandığı alanlar.
 */
export type AnalizKaydi = { tarih: string; ders: string; soru: number };

export type AnalizDenemesi = {
  id: string;
  tarih: string;
  sinav: SinavTuru;
  ad: string;
  toplamNet: number;
  /** ders anahtarı → net */
  netler: Record<string, number>;
};

export function analizVerisi(
  kayitlar: Pick<CalismaKaydi, "tarih" | "ders" | "soru">[],
  denemeler: DenemeToplam[],
  bolumler: DenemeDers[],
): { kayitlar: AnalizKaydi[]; denemeler: AnalizDenemesi[] } {
  const netler = new Map<string, Record<string, number>>();
  for (const b of bolumler) {
    const n = netler.get(b.mock_exam_id) ?? {};
    n[b.ders] = Number(b.net);
    netler.set(b.mock_exam_id, n);
  }

  return {
    kayitlar: kayitlar.map((k) => ({ tarih: k.tarih, ders: k.ders, soru: k.soru })),
    denemeler: [...denemeler]
      .sort((a, b) => a.tarih.localeCompare(b.tarih))
      .map((d) => ({
        id: d.id,
        tarih: d.tarih,
        sinav: d.sinav,
        ad: d.ad,
        toplamNet: Number(d.toplam_net),
        netler: netler.get(d.id) ?? {},
      })),
  };
}
