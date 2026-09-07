import type { Metadata } from "next";
import {
  DersDagilimGrafigi,
  HaftalikSoruGrafigi,
  HaftalikSureGrafigi,
  NetTrendGrafigi,
} from "@/components/grafikler";
import { Card, CardHeader, TableWrap, Td, Th } from "@/components/ui";
import { gerekliProfil, type CalismaKaydi, type DenemeToplam } from "@/lib/db";
import { dersDagilimi, haftalikOzet, netTrendi } from "@/lib/istatistik";
import { haftaBasi, isoTarih, kisaTarih, netYaz } from "@/lib/yks";

export const metadata: Metadata = { title: "Gelişim" };

const HAFTA_SAYISI = 12;

export default async function GelisimSayfasi() {
  const { supabase, user } = await gerekliProfil();

  const basla = haftaBasi(new Date());
  basla.setUTCDate(basla.getUTCDate() - (HAFTA_SAYISI - 1) * 7);

  const [calismaSonuc, denemeSonuc] = await Promise.all([
    supabase.from("study_logs").select("*").eq("user_id", user.id).gte("tarih", isoTarih(basla)),
    supabase.from("mock_exam_totals").select("*").eq("user_id", user.id).order("tarih"),
  ]);

  const kayitlar = (calismaSonuc.data ?? []) as CalismaKaydi[];
  const denemeler = (denemeSonuc.data ?? []) as DenemeToplam[];

  const haftalar = haftalikOzet(kayitlar, denemeler, HAFTA_SAYISI);
  const trend = netTrendi(denemeler);
  const dagilim = dersDagilimi(kayitlar);

  const toplamSoru = kayitlar.reduce((t, k) => t + k.soru, 0);
  const toplamSure = kayitlar.reduce((t, k) => t + (k.sure_dk ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Gelişim</h1>
        <p className="mt-1 text-sm text-muted-ink">
          Son {HAFTA_SAYISI} hafta · {toplamSoru.toLocaleString("tr-TR")} soru ·{" "}
          {Math.round((toplamSure / 60) * 10) / 10} saat
        </p>
      </div>

      <Card>
        <CardHeader title="Deneme net trendi" description="TYT düz çizgi, AYT kesikli çizgi" />
        <NetTrendGrafigi veri={trend} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Haftalık çözülen soru" />
          <HaftalikSoruGrafigi veri={haftalar} />
        </Card>
        <Card>
          <CardHeader title="Haftalık çalışma süresi" description="Dakika" />
          <HaftalikSureGrafigi veri={haftalar} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Ders bazlı soru dağılımı" description="En çok çalıştığın 10 ders" />
        <DersDagilimGrafigi veri={dagilim} />
      </Card>

      <Card>
        <CardHeader
          title="Haftalık özet"
          description="Çalışma bloğu = kaydettiğin ayrı giriş sayısı."
        />
        <TableWrap>
          <thead>
            <tr>
              <Th>Hafta</Th>
              <Th className="text-right">Soru</Th>
              <Th className="text-right">Süre (dk)</Th>
              <Th className="text-right">Blok</Th>
              <Th className="text-right">Deneme</Th>
              <Th className="text-right">TYT ort.</Th>
              <Th className="text-right">AYT ort.</Th>
            </tr>
          </thead>
          <tbody>
            {[...haftalar].reverse().map((h) => (
              <tr key={h.baslangic} className="transition-colors duration-200 hover:bg-canvas">
                <Td className="tabular whitespace-nowrap">
                  {kisaTarih(h.baslangic)} – {kisaTarih(h.bitis)}
                </Td>
                <Td className="tabular text-right font-semibold text-heading">{h.soru}</Td>
                <Td className="tabular text-right text-muted-ink">{h.sure}</Td>
                <Td className="tabular text-right text-muted-ink">{h.blok}</Td>
                <Td className="tabular text-right text-muted-ink">{h.denemeSayisi}</Td>
                <Td className="tabular text-right">{netYaz(h.tytNet)}</Td>
                <Td className="tabular text-right">{netYaz(h.aytNet)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
    </div>
  );
}
