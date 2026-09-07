import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ClipboardList, PenLine, Target } from "lucide-react";
import { HaftalikSoruGrafigi, NetTrendGrafigi } from "@/components/grafikler";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Stat,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { gerekliProfil, type CalismaKaydi, type DenemeDers, type DenemeToplam, type HedefNet } from "@/lib/db";
import { haftalikOzet, hedefKarsilastirma, kalanGun, netTrendi } from "@/lib/istatistik";
import { dersAdi, haftaBasi, isoTarih, netYaz, tarihYaz } from "@/lib/yks";

export const metadata: Metadata = { title: "Panel" };

export default async function PanelSayfasi() {
  const { supabase, user, profil } = await gerekliProfil();

  // Son 8 haftayı kapsayacak kadar geriye git.
  const basla = haftaBasi(new Date());
  basla.setUTCDate(basla.getUTCDate() - 7 * 7);
  const baslaIso = isoTarih(basla);

  const [calismaSonuc, denemeSonuc, hedefSonuc] = await Promise.all([
    supabase.from("study_logs").select("*").eq("user_id", user.id).gte("tarih", baslaIso),
    supabase.from("mock_exam_totals").select("*").eq("user_id", user.id).order("tarih"),
    supabase.from("net_targets").select("sinav, ders, hedef_net").eq("user_id", user.id),
  ]);

  const kayitlar = (calismaSonuc.data ?? []) as CalismaKaydi[];
  const denemeler = (denemeSonuc.data ?? []) as DenemeToplam[];
  const hedefler = (hedefSonuc.data ?? []) as HedefNet[];

  const sonDenemeIdleri = [...denemeler]
    .sort((a, b) => b.tarih.localeCompare(a.tarih))
    .slice(0, 12)
    .map((d) => d.id);

  const { data: bolumVerisi } = sonDenemeIdleri.length
    ? await supabase.from("mock_exam_sections").select("*").in("mock_exam_id", sonDenemeIdleri)
    : { data: [] };
  const bolumler = (bolumVerisi ?? []) as DenemeDers[];

  const haftalar = haftalikOzet(kayitlar, denemeler, 8);
  const buHafta = haftalar[haftalar.length - 1];
  const gecenHafta = haftalar[haftalar.length - 2];
  const trend = netTrendi(denemeler);
  const karsilastirma = hedefKarsilastirma(hedefler, denemeler, bolumler);
  const gun = kalanGun(profil.sinav_tarihi);

  const sonNet = (sinav: "TYT" | "AYT") => {
    const liste = denemeler.filter((d) => d.sinav === sinav);
    if (liste.length === 0) return null;
    return Number(liste[liste.length - 1].toplam_net);
  };

  const soruFarki = buHafta.soru - (gecenHafta?.soru ?? 0);
  const ilkAd = (profil.ad_soyad ?? "").split(" ")[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">
            {ilkAd ? `Merhaba ${ilkAd}` : "Merhaba"}
          </h1>
          <p className="mt-1 text-sm text-muted-ink">
            {profil.hedef_universite || profil.hedef_bolum
              ? [profil.hedef_universite, profil.hedef_bolum].filter(Boolean).join(" — ")
              : "Hedefini Ayarlar'dan ekleyebilirsin."}
            {profil.hedef_siralama ? ` · Hedef sıralama ${profil.hedef_siralama.toLocaleString("tr-TR")}` : ""}
          </p>
        </div>

        {gun !== null && (
          <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-warn-soft px-3 py-2">
            <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-warn">
              Sınava <span className="tabular font-semibold">{gun}</span> gün
              <span className="ml-1 text-xs opacity-80">
                ({tarihYaz(profil.sinav_tarihi!)})
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/panel/soru" className="block">
          <Button size="lg" className="w-full justify-start">
            <PenLine className="h-5 w-5" aria-hidden="true" />
            Günlük soru girişi
          </Button>
        </Link>
        <Link href="/panel/deneme" className="block">
          <Button variant="secondary" size="lg" className="w-full justify-start">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
            Deneme sınavı sonucu ekle
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Bu hafta soru"
          value={buHafta.soru}
          sub={
            gecenHafta
              ? soruFarki === 0
                ? "Geçen haftayla aynı"
                : `Geçen haftaya göre ${soruFarki > 0 ? "+" : ""}${soruFarki}`
              : undefined
          }
          tone={soruFarki >= 0 ? "default" : "danger"}
        />
        <Stat
          label="Bu hafta süre"
          value={Math.round((buHafta.sure / 60) * 10) / 10}
          unit="saat"
          sub={`${buHafta.blok} çalışma bloğu`}
        />
        <Stat
          label="Son TYT net"
          value={netYaz(sonNet("TYT"))}
          sub={`${denemeler.filter((d) => d.sinav === "TYT").length} deneme`}
          tone="accent"
        />
        <Stat
          label="Son AYT net"
          value={netYaz(sonNet("AYT"))}
          sub={`${denemeler.filter((d) => d.sinav === "AYT").length} deneme`}
          tone="accent"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Haftalık çözülen soru" description="Son 8 hafta" />
          <HaftalikSoruGrafigi veri={haftalar} />
        </Card>

        <Card>
          <CardHeader title="Deneme net trendi" description="Her nokta bir deneme günü" />
          <NetTrendGrafigi veri={trend} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Hedef netlere ne kadar yakınsın?"
          description="Mevcut ortalama, her sınavın son 3 denemesinden hesaplanır."
          action={
            <Link href="/panel/ayarlar">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4" aria-hidden="true" />
                Hedefleri düzenle
              </Button>
            </Link>
          }
        />

        {karsilastirma.length === 0 ? (
          <EmptyState
            title="Hedef net tanımlı değil"
            description="Ayarlar sayfasından her ders için hedef netini belirle."
            action={
              <Link href="/panel/ayarlar">
                <Button size="md">Ayarlara git</Button>
              </Link>
            }
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Sınav</Th>
                <Th>Ders</Th>
                <Th className="text-right">Hedef net</Th>
                <Th className="text-right">Mevcut ort.</Th>
                <Th className="text-right">Fark</Th>
                <Th>Durum</Th>
              </tr>
            </thead>
            <tbody>
              {karsilastirma.map((s) => (
                <tr key={`${s.sinav}-${s.ders}`} className="transition-colors duration-200 hover:bg-canvas">
                  <Td>
                    <Badge tone={s.sinav === "TYT" ? "tyt" : "ayt"}>{s.sinav}</Badge>
                  </Td>
                  <Td className="font-medium text-heading">{dersAdi(s.ders)}</Td>
                  <Td className="tabular text-right">{netYaz(s.hedef)}</Td>
                  <Td className="tabular text-right">{netYaz(s.mevcut)}</Td>
                  <Td
                    className={`tabular text-right font-semibold ${
                      s.fark === null ? "text-muted-ink" : s.fark >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {s.fark === null ? "—" : `${s.fark > 0 ? "+" : ""}${netYaz(s.fark)}`}
                  </Td>
                  <Td className="text-muted-ink">
                    {s.fark === null ? (
                      "Deneme verisi yok"
                    ) : s.fark >= 0 ? (
                      <Badge tone="success">Hedefte</Badge>
                    ) : (
                      <Badge tone="warn">{netYaz(Math.abs(s.fark))} net eksik</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
