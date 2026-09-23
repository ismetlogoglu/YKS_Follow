"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HaftaSatiri, NetNoktasi } from "@/lib/istatistik";
import { netYaz } from "@/lib/yks";

const RENK = {
  tyt: "#1e40af",
  ayt: "#b45309", // --color-accent ile aynı ton; mavi/turuncu çifti renk körlüğünde de ayrışır

  soru: "#3b82f6",
  sure: "#64748b",
  izgara: "#dbeafe",
  eksen: "#475569",
};

const EKSEN = { fontSize: 12, fill: RENK.eksen };

/** Recharts'ın varsayılan tooltip'i yerine okunur, Türkçe ve tabular bir kutu. */
function Kutu({
  active,
  payload,
  label,
  birim,
}: {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number | string | null;
    color?: string;
    payload?: { baslik?: string };
  }[];
  label?: string | number;
  birim?: string;
}) {
  // Boş nokta (henüz gelmemiş gün, o dersi içermeyen deneme) için ipucu açma.
  // Aynı seriyi iki kez çizen grafikte (çubuk + çizgi) aynı ad bir kez yazılsın:
  // Recharts 3, çizgideki tooltipType="none"a rağmen onu da listeye koyuyor.
  const dolu = (payload?.filter((p) => p.value != null) ?? []).filter(
    (p, i, dizi) => dizi.findIndex((x) => x.name === p.name) === i,
  );
  if (!active || !dolu.length) return null;
  const baslik = dolu[0]?.payload?.baslik ?? label;

  return (
    <div className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="mb-1 font-medium text-heading">{baslik}</p>
      {dolu.map((p, i) => (
        <p key={i} className="tabular flex items-center gap-2 text-muted-ink">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
            aria-hidden="true"
          />
          {p.name}:{" "}
          <span className="font-semibold text-ink">
            {typeof p.value === "number" ? netYaz(p.value) : (p.value ?? "—")}
            {birim ? ` ${birim}` : ""}
          </span>
        </p>
      ))}
    </div>
  );
}

function Bos({ mesaj }: { mesaj: string }) {
  return (
    <div className="flex h-64 items-center justify-center px-4 text-center text-sm text-muted-ink">
      {mesaj}
    </div>
  );
}

export function HaftalikSoruGrafigi({ veri }: { veri: HaftaSatiri[] }) {
  if (veri.every((h) => h.soru === 0)) {
    return <Bos mesaj="Henüz soru kaydı yok. İlk girişini yaptığında bu grafik dolmaya başlar." />;
  }

  return (
    <div className="h-64 w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={veri} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={RENK.izgara} vertical={false} />
          <XAxis dataKey="hafta" tick={EKSEN} tickLine={false} axisLine={{ stroke: RENK.izgara }} />
          <YAxis tick={EKSEN} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            content={<Kutu birim="soru" />}
            cursor={{ fill: RENK.izgara, fillOpacity: 0.5 }}
          />
          <Bar dataKey="soru" name="Çözülen soru" fill={RENK.soru} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HaftalikSureGrafigi({ veri }: { veri: HaftaSatiri[] }) {
  if (veri.every((h) => h.sure === 0)) {
    return <Bos mesaj="Süre bilgisi girilen kayıt yok." />;
  }

  return (
    <div className="h-64 w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={veri} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={RENK.izgara} vertical={false} />
          <XAxis dataKey="hafta" tick={EKSEN} tickLine={false} axisLine={{ stroke: RENK.izgara }} />
          <YAxis tick={EKSEN} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<Kutu birim="dk" />} cursor={{ fill: RENK.izgara, fillOpacity: 0.5 }} />
          <Bar dataKey="sure" name="Çalışma süresi" fill={RENK.sure} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetTrendGrafigi({ veri }: { veri: NetNoktasi[] }) {
  if (veri.length === 0) {
    return <Bos mesaj="Henüz deneme kaydı yok. İlk denemeni girdiğinde net trendin burada çizilir." />;
  }

  return (
    <div className="h-64 w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={veri} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={RENK.izgara} vertical={false} />
          <XAxis
            dataKey="etiket"
            tick={EKSEN}
            tickLine={false}
            axisLine={{ stroke: RENK.izgara }}
          />
          <YAxis tick={EKSEN} tickLine={false} axisLine={false} />
          <Tooltip content={<Kutu birim="net" />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {/* Çizgiler renkle birlikte desenle de ayrılıyor: renk körlüğünde de okunur. */}
          <Line
            type="monotone"
            dataKey="TYT"
            stroke={RENK.tyt}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="AYT"
            stroke={RENK.ayt}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Ders bazlı haftalık soru — yığılmış sütun.
 * Renkler mavi→turuncu ekseninde ayrık seçildi; bitişik dilimler hem tonda hem
 * parlaklıkta ayrışsın diye sırayla değil, atlayarak uygulanıyor.
 */
const DERS_RENKLERI = [
  "#1e40af",
  "#b45309",
  "#0e7490",
  "#7c3aed",
  "#15803d",
  "#be123c",
  "#64748b",
];

export function DersBazliHaftalikGrafigi({
  veri,
  dersAdlari,
}: {
  veri: Record<string, string | number>[];
  dersAdlari: string[];
}) {
  if (dersAdlari.length === 0) {
    return <Bos mesaj="Henüz soru kaydı yok. Ders bazlı dağılım ilk girişten sonra oluşur." />;
  }

  return (
    <div className="h-72 w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={veri} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={RENK.izgara} vertical={false} />
          <XAxis dataKey="hafta" tick={EKSEN} tickLine={false} axisLine={{ stroke: RENK.izgara }} />
          <YAxis tick={EKSEN} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            content={<Kutu birim="soru" />}
            cursor={{ fill: RENK.izgara, fillOpacity: 0.5 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {dersAdlari.map((ad, i) => (
            <Bar
              key={ad}
              dataKey={ad}
              stackId="ders"
              fill={DERS_RENKLERI[i % DERS_RENKLERI.length]}
              radius={i === dersAdlari.length - 1 ? [3, 3, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Analiz ekranı                                                             */
/* -------------------------------------------------------------------------- */

/** `soru: null` = henüz gelmemiş gün; 0 çizilirse çizgi o güne düşüyormuş gibi görünür. */
export type GunVerisi = { gun: string; baslik: string; soru: number | null };

/**
 * Haftanın 7 günü: çubuk = o gün çözülen soru, çizgi aynı değerlerin eğilimi.
 * Çizgi ipucunda tekrar edilmiyor (aynı ad, Kutu tekrarları ayıklıyor), aynı sayıyı iki kez
 * göstermenin anlamı yok.
 */
export function HaftaGunluGrafik({ veri }: { veri: GunVerisi[] }) {
  return (
    <div className="h-72 w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={veri} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={RENK.izgara} vertical={false} />
          <XAxis dataKey="gun" tick={EKSEN} tickLine={false} axisLine={{ stroke: RENK.izgara }} />
          <YAxis tick={EKSEN} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            content={<Kutu birim="soru" />}
            cursor={{ fill: RENK.izgara, fillOpacity: 0.5 }}
          />
          <Bar
            dataKey="soru"
            name="Çözülen soru"
            fill={RENK.soru}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Line
            dataKey="soru"
            name="Çözülen soru"
            type="monotone"
            stroke={RENK.tyt}
            strokeWidth={2}
            dot={{ r: 3, fill: RENK.tyt }}
            activeDot={false}
            tooltipType="none"
            legendType="none"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Ders ders toplam çözülen soru — etiketler çağıranın hazırladığı gibi (TYT/AYT önekli). */
export function DersToplamGrafigi({ veri }: { veri: { ad: string; soru: number }[] }) {
  return (
    <div className="w-full p-2" style={{ height: Math.max(veri.length * 34 + 40, 180) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={veri} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid stroke={RENK.izgara} horizontal={false} />
          <XAxis type="number" tick={EKSEN} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="ad" tick={EKSEN} tickLine={false} axisLine={false} width={150} />
          <Tooltip content={<Kutu birim="soru" />} cursor={{ fill: RENK.izgara, fillOpacity: 0.5 }} />
          <Bar dataKey="soru" name="Toplam çözülen" fill={RENK.soru} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type DenemeNoktasi = { etiket: string; baslik: string; net: number | null };

/** Seçilen ders ya da toplam için deneme netlerinin zaman içindeki seyri. */
export function DenemeNetGrafigi({ veri, renk }: { veri: DenemeNoktasi[]; renk: "tyt" | "ayt" }) {
  return (
    <div className="h-72 w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={veri} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={RENK.izgara} vertical={false} />
          <XAxis dataKey="etiket" tick={EKSEN} tickLine={false} axisLine={{ stroke: RENK.izgara }} />
          {/* Net eksi olabilir (yanlış/4 doğruyu geçerse); alt sınırı 0'a kilitlemek onu keserdi. */}
          <YAxis
            tick={EKSEN}
            tickLine={false}
            axisLine={false}
            domain={[(min: number) => Math.min(0, Math.floor(min)), "auto"]}
          />
          <Tooltip content={<Kutu birim="net" />} />
          <Line
            dataKey="net"
            name="Net"
            type="monotone"
            stroke={RENK[renk]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export type DagilimDilimi = { ad: string; soru: number; renk: string };

function DilimKutusu({
  active,
  payload,
  toplam,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: { renk?: string } }[];
  toplam: number;
}) {
  const p = payload?.[0];
  if (!active || !p || !toplam) return null;
  const soru = Number(p.value ?? 0);
  return (
    <div className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="flex items-center gap-2 font-medium text-heading">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: p.payload?.renk }}
          aria-hidden="true"
        />
        {p.name}
      </p>
      <p className="tabular text-muted-ink">
        <span className="font-semibold text-ink">{soru.toLocaleString("tr-TR")}</span> soru · %
        {Math.round((soru / toplam) * 100)}
      </p>
    </div>
  );
}

/**
 * Haftalık ders dağılımı. En büyük dilim saat 12'den başlayıp saat yönünde
 * küçülerek iniyor; ortada haftanın toplamı. Renk tek başına anlam taşımıyor:
 * çağıran yanına her dersin sayısını ve yüzdesini yazan listeyi koyuyor.
 */
export function DersDagilimGrafigi({ veri, toplam }: { veri: DagilimDilimi[]; toplam: number }) {
  return (
    <div className="relative aspect-square w-full max-w-[220px]">
      {/* Ortadaki toplam grafikten önce: ipucu kutusu üstünden geçerken onu örtsün. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl leading-tight font-semibold text-heading">
          {toplam.toLocaleString("tr-TR")}
        </span>
        <span className="text-xs text-muted-ink">soru</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={veri}
            dataKey="soru"
            nameKey="ad"
            innerRadius="62%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            paddingAngle={veri.length > 1 ? 1.5 : 0}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {veri.map((d) => (
              <Cell key={d.ad} fill={d.renk} />
            ))}
          </Pie>
          <Tooltip content={<DilimKutusu toplam={toplam} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
