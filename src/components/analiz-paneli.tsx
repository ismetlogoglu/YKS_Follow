"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnalizDenemesi, AnalizKaydi } from "@/lib/analiz";
import {
  GUNLER,
  calismaDersleri,
  dersAdi,
  dersler,
  haftaninGunleri,
  type Alan,
  type SinavTuru,
} from "@/lib/yks";
import {
  DenemeNetGrafigi,
  DersToplamGrafigi,
  HaftaGunluGrafik,
  type GunVerisi,
  type DenemeNoktasi,
} from "./grafikler";
import { Button, Card, CardHeader, Select, Stat } from "./ui";

const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
// Intl yerine sabit ay adları: sunucu (Node ICU) ile telefonun tarih biçimi farklı
// çıkarsa canlandırma sırasında metin uyuşmazlığı olurdu.
const AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const AY_UZUN = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function gunAy(iso: string, uzunAy = false): string {
  const [, a, g] = iso.split("-").map(Number);
  return `${g} ${uzunAy ? AY_UZUN[a - 1] : AY_KISA[a - 1]}`;
}

function haftaAraligi(bas: string, bit: string): string {
  if (bas.slice(0, 7) === bit.slice(0, 7)) return `${Number(bas.slice(8))}–${gunAy(bit, true)}`;
  return `${gunAy(bas)} – ${gunAy(bit)}`;
}

/** "Fizik" hem TYT'de hem AYT'de var; seçim listesinde ve grafikte karışmasın. */
function onEkliAd(key: string): string {
  const onEk = key.startsWith("tyt_") ? "TYT " : key.startsWith("ayt_") ? "AYT " : "";
  return onEk + dersAdi(key);
}

const topla = (liste: AnalizKaydi[]) => liste.reduce((t, k) => t + k.soru, 0);

export function AnalizPaneli({
  alan,
  bugun,
  kayitlar,
  denemeler,
  ozetGoster = true,
}: {
  alan: Alan;
  /** Türkiye takvimindeki bugün — sunucu ve telefon aynı haftayı çizsin diye dışarıdan. */
  bugun: string;
  kayitlar: AnalizKaydi[];
  denemeler: AnalizDenemesi[];
  /** Eğitmen sayfasında toplamlar zaten üstte gösteriliyor; orada tekrar etme. */
  ozetGoster?: boolean;
}) {
  const [haftaOfseti, setHaftaOfseti] = useState(0);
  const [haftaDersi, setHaftaDersi] = useState("");
  const [denemeSecimi, setDenemeSecimi] = useState<`${SinavTuru}:${string}`>("TYT:toplam");

  // Alanın dersleri + alan değiştiyse eski kayıtlarda kalan dersler.
  const dersSecenekleri = useMemo(() => {
    const alanin = [...calismaDersleri(alan, "TYT"), ...calismaDersleri(alan, "AYT")].map(
      (d) => d.key,
    );
    const eski = [...new Set(kayitlar.map((k) => k.ders))].filter((k) => !alanin.includes(k));
    return [...alanin, ...eski];
  }, [alan, kayitlar]);

  /* ------------------------------------------------------------- haftalık */
  const gunler = haftaninGunleri(bugun, haftaOfseti);
  const haftaVerisi: GunVerisi[] = gunler.map((iso, i) => ({
    gun: GUN_KISA[i],
    baslik: `${GUNLER[i]}, ${gunAy(iso, true)}`,
    soru:
      iso > bugun
        ? null
        : topla(kayitlar.filter((k) => k.tarih === iso && (!haftaDersi || k.ders === haftaDersi))),
  }));
  const haftaToplami = haftaVerisi.reduce((t, g) => t + (g.soru ?? 0), 0);

  const buHafta = haftaninGunleri(bugun, 0);
  const buHaftaToplami = topla(kayitlar.filter((k) => k.tarih >= buHafta[0] && k.tarih <= buHafta[6]));

  /* ------------------------------------------------------------ ders ders */
  const dersToplamlari = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of kayitlar) m.set(k.ders, (m.get(k.ders) ?? 0) + k.soru);
    return [...m]
      .map(([ders, soru]) => ({ ad: onEkliAd(ders), soru }))
      .sort((a, b) => b.soru - a.soru);
  }, [kayitlar]);

  /* --------------------------------------------------------------- deneme */
  const [secilenSinav, secilenDers] = denemeSecimi.split(":") as [SinavTuru, string];
  const denemeVerisi: DenemeNoktasi[] = denemeler
    .filter((d) => d.sinav === secilenSinav)
    .map((d) => ({
      etiket: gunAy(d.tarih),
      baslik: `${d.ad} · ${gunAy(d.tarih, true)}`,
      net: secilenDers === "toplam" ? d.toplamNet : (d.netler[secilenDers] ?? null),
    }));
  const denemeBasligi =
    secilenDers === "toplam" ? `${secilenSinav} toplam net` : `${secilenSinav} · ${dersAdi(secilenDers)}`;

  return (
    <div className="flex flex-col gap-5">
      {ozetGoster && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Toplam çözülen soru"
            value={topla(kayitlar).toLocaleString("tr-TR")}
            sub={`${kayitlar.length} kayıt`}
          />
          <Stat label="Bu hafta çözülen" value={buHaftaToplami.toLocaleString("tr-TR")} unit="soru" />
        </div>
      )}

      {/* ---------------------------------------------------- haftalık grafik */}
      <Card>
        <CardHeader
          title="Haftalık çözülen soru"
          description={`${haftaAraligi(gunler[0], gunler[6])} · toplam ${haftaToplami.toLocaleString("tr-TR")} soru`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="md"
                  className="px-3"
                  aria-label="Önceki hafta"
                  onClick={() => setHaftaOfseti((o) => o - 1)}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span className="min-w-[5.5rem] text-center text-sm font-medium text-heading">
                  {haftaOfseti === 0 ? "Bu hafta" : haftaOfseti === -1 ? "Geçen hafta" : `${-haftaOfseti} hafta önce`}
                </span>
                <Button
                  variant="outline"
                  size="md"
                  className="px-3"
                  aria-label="Sonraki hafta"
                  disabled={haftaOfseti === 0}
                  onClick={() => setHaftaOfseti((o) => Math.min(0, o + 1))}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="w-full sm:w-52">
                <Select
                  aria-label="Ders seç"
                  value={haftaDersi}
                  onChange={(e) => setHaftaDersi(e.target.value)}
                >
                  <option value="">Tüm dersler</option>
                  {dersSecenekleri.map((k) => (
                    <option key={k} value={k}>
                      {onEkliAd(k)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          }
        />
        {haftaToplami === 0 ? (
          <p className="flex h-72 items-center justify-center px-4 text-center text-sm text-muted-ink">
            {haftaDersi ? `Bu hafta ${onEkliAd(haftaDersi)} için kayıt yok.` : "Bu hafta kayıt yok."}
          </p>
        ) : (
          <HaftaGunluGrafik veri={haftaVerisi} />
        )}
      </Card>

      {/* ------------------------------------------------ ders ders toplam */}
      <Card>
        <CardHeader title="Ders ders toplam çözülen soru" description="Tüm kayıtlar" />
        {dersToplamlari.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-ink">Henüz soru kaydı yok.</p>
        ) : (
          <DersToplamGrafigi veri={dersToplamlari} />
        )}
      </Card>

      {/* --------------------------------------------- deneme ders ders net */}
      <Card>
        <CardHeader
          title="Deneme netleri"
          description={denemeBasligi}
          action={
            <div className="w-full sm:w-56">
              <Select
                aria-label="Sınav ve ders seç"
                value={denemeSecimi}
                onChange={(e) => setDenemeSecimi(e.target.value as `${SinavTuru}:${string}`)}
              >
                {(["TYT", "AYT"] as const).map((s) => (
                  <optgroup key={s} label={s}>
                    <option value={`${s}:toplam`}>{s} toplam net</option>
                    {dersler(alan, s).map((d) => (
                      <option key={d.key} value={`${s}:${d.key}`}>
                        {d.ad}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
          }
        />
        {denemeVerisi.length === 0 ? (
          <p className="flex h-72 items-center justify-center px-4 text-center text-sm text-muted-ink">
            Henüz {secilenSinav} denemesi yok.
          </p>
        ) : (
          <DenemeNetGrafigi veri={denemeVerisi} renk={secilenSinav === "TYT" ? "tyt" : "ayt"} />
        )}
      </Card>
    </div>
  );
}
