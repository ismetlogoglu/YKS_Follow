import type { CalismaKaydi, DenemeDers, DenemeToplam } from "./db";
import type { SinavTuru } from "./yks";

/**
 * Analiz ekranına giden en küçük veri. İstemci bileşenine ham satırlar yerine
 * bunlar gidiyor: hafta/ders seçimleri tarayıcıda yapıldığı için tüm kayıtlar
 * gerekli, ama yalnızca grafiğin kullandığı alanlar.
 */
export type AnalizKaydi = { tarih: string; ders: string; soru: number };

export type DenemeBolumu = { dogru: number; yanlis: number; net: number };

export type AnalizDenemesi = {
  id: string;
  tarih: string;
  sinav: SinavTuru;
  ad: string;
  toplamDogru: number;
  toplamYanlis: number;
  toplamNet: number;
  /** ders anahtarı → o testin doğru/yanlış/neti */
  bolumler: Record<string, DenemeBolumu>;
};

/**
 * Denemeler tarihe göre eskiden yeniye dizilir. Sıralama kararlı olduğu için aynı
 * günün denemeleri sorgunun getirdiği sırada (created_at) kalır.
 */
export function analizVerisi(
  kayitlar: Pick<CalismaKaydi, "tarih" | "ders" | "soru">[],
  denemeler: DenemeToplam[],
  bolumler: DenemeDers[],
): { kayitlar: AnalizKaydi[]; denemeler: AnalizDenemesi[] } {
  const denemeBolumleri = new Map<string, Record<string, DenemeBolumu>>();
  for (const b of bolumler) {
    const m = denemeBolumleri.get(b.mock_exam_id) ?? {};
    m[b.ders] = { dogru: b.dogru, yanlis: b.yanlis, net: Number(b.net) };
    denemeBolumleri.set(b.mock_exam_id, m);
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
        toplamDogru: d.toplam_dogru,
        toplamYanlis: d.toplam_yanlis,
        toplamNet: Number(d.toplam_net),
        bolumler: denemeBolumleri.get(d.id) ?? {},
      })),
  };
}
