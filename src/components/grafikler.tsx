"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HaftaSatiri, NetNoktasi } from "@/lib/istatistik";
import { dersAdi, netYaz } from "@/lib/yks";

const RENK = {
  tyt: "#1e40af",
  ayt: "#d97706",
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
  payload?: { name?: string; value?: number | string | null; color?: string }[];
  label?: string | number;
  birim?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="mb-1 font-medium text-heading">{label}</p>
      {payload.map((p, i) => (
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

export function DersDagilimGrafigi({ veri }: { veri: { ders: string; soru: number }[] }) {
  if (veri.length === 0) return <Bos mesaj="Henüz soru kaydı yok." />;

  const veriler = veri.slice(0, 10).map((d) => ({ ...d, ad: dersAdi(d.ders) }));

  return (
    <div className="w-full p-2" style={{ height: Math.max(veriler.length * 34 + 40, 180) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={veriler}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke={RENK.izgara} horizontal={false} />
          <XAxis type="number" tick={EKSEN} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="ad"
            tick={EKSEN}
            tickLine={false}
            axisLine={false}
            width={130}
          />
          <Tooltip
            content={<Kutu birim="soru" />}
            cursor={{ fill: RENK.izgara, fillOpacity: 0.5 }}
          />
          <Bar dataKey="soru" name="Çözülen soru" fill={RENK.soru} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
