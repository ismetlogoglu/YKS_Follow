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
  DersDagilimGrafigi,
  DersToplamGrafigi,
  HaftaGunluGrafik,
  type DagilimDilimi,
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

/**
 * Donut dilimleri: sıraya göre (en büyük ders ilk renk). Birbirinden ayrışan altı
 * ton (tam 6 ders varsa hepsi ayrı dilim olur) + "Diğer" için nötr gri; turuncu ve
 * kahverengi yok. Dilimler beyaz boşluklarla ayrılıyor, değerler yanındaki listede.
 */
const DILIM_RENKLERI = ["#2563eb", "#0d9488", "#8b5cf6", "#f43f5e", "#65a30d", "#ca8a04"];
const DIGER_RENGI = "#64748b";
/** Beceri önerisi: donut'ta en fazla 6 dilim; fazlası "Diğer"de toplanır. */
const EN_COK_DILIM = 5;

function yuzde(pay: number, toplam: number): string {
  const y = (pay / toplam) * 100;
  return y > 0 && y < 1 ? "<%1" : `%${Math.round(y)}`;
}

function haftaEtiketi(ofset: number): string {
  return ofset === 0 ? "Bu hafta" : ofset === -1 ? "Geçen hafta" : `${-ofset} hafta önce`;
}

/** Önceki / sonraki hafta düğmeleri — haftalık grafik ve ders dağılımı ortak kullanıyor. */
function HaftaSecici({ ofset, degistir }: { ofset: number; degistir: (o: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="md"
        className="px-3"
        aria-label="Önceki hafta"
        onClick={() => degistir(ofset - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span className="min-w-[5.5rem] text-center text-sm font-medium text-heading" aria-live="polite">
        {haftaEtiketi(ofset)}
      </span>
      <Button
        variant="outline"
        size="md"
        className="px-3"
        aria-label="Sonraki hafta"
        disabled={ofset === 0}
        onClick={() => degistir(Math.min(0, ofset + 1))}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

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
  const [dagilimOfseti, setDagilimOfseti] = useState(0);
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

  /* ------------------------------------------------- haftalık dağılım */
  const dagilimGunleri = haftaninGunleri(bugun, dagilimOfseti);
  const dagilim = (() => {
    const m = new Map<string, number>();
    for (const k of kayitlar) {
      if (k.tarih < dagilimGunleri[0] || k.tarih > dagilimGunleri[6]) continue;
      m.set(k.ders, (m.get(k.ders) ?? 0) + k.soru);
    }
    const sirali = [...m].sort((a, b) => b[1] - a[1]);
    const toplam = sirali.reduce((t, [, n]) => t + n, 0);
    // 6 dilimi aşacaksa ilk 5 ayrı, kalanı "Diğer"; tam 6 dersse hepsi ayrı gösterilir.
    const ayri = sirali.length > EN_COK_DILIM + 1 ? sirali.slice(0, EN_COK_DILIM) : sirali;
    const kalan = sirali.slice(ayri.length);

    const dilimler: (DagilimDilimi & { alt?: string })[] = ayri.map(([ders, soru], i) => ({
      ad: onEkliAd(ders),
      soru,
      renk: DILIM_RENKLERI[i],
    }));
    if (kalan.length > 0) {
      dilimler.push({
        ad: `Diğer (${kalan.length} ders)`,
        soru: kalan.reduce((t, [, n]) => t + n, 0),
        renk: DIGER_RENGI,
        alt: kalan.map(([ders, n]) => `${onEkliAd(ders)} ${n}`).join(" · "),
      });
    }
    return { dilimler, toplam };
  })();

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
      net: secilenDers === "toplam" ? d.toplamNet : (d.bolumler[secilenDers]?.net ?? null),
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
              <HaftaSecici ofset={haftaOfseti} degistir={setHaftaOfseti} />
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

      {/* -------------------------------------------- haftalık ders dağılımı */}
      <Card>
        <CardHeader
          title="Haftalık ders dağılımı"
          description={`${haftaAraligi(dagilimGunleri[0], dagilimGunleri[6])} · hangi derse ne kadar soru`}
          action={<HaftaSecici ofset={dagilimOfseti} degistir={setDagilimOfseti} />}
        />
        {dagilim.toplam === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-muted-ink">
            {haftaEtiketi(dagilimOfseti)} için soru kaydı yok.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 p-4 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
            <DersDagilimGrafigi veri={dagilim.dilimler} toplam={dagilim.toplam} />
            <ul className="w-full min-w-0 flex-1 divide-y divide-line">
              {dagilim.dilimler.map((d) => (
                <li key={d.ad} className="flex items-start gap-3 py-2">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: d.renk }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{d.ad}</p>
                    {d.alt && <p className="mt-0.5 text-xs text-muted-ink">{d.alt}</p>}
                  </div>
                  <p className="tabular shrink-0 text-right text-sm">
                    <span className="font-semibold text-heading">{d.soru.toLocaleString("tr-TR")}</span>
                    <span className="ml-2 inline-block w-10 text-muted-ink">
                      {yuzde(d.soru, dagilim.toplam)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
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
