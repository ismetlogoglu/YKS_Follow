import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import {
  DersDagilimGrafigi,
  HaftalikSoruGrafigi,
  HaftalikSureGrafigi,
  NetTrendGrafigi,
} from "@/components/grafikler";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  GeriBaglantisi,
  Stat,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { ogrenciVerisi } from "@/lib/admin";
import { dersDagilimi, haftalikOzet, hedefKarsilastirma, kalanGun, netTrendi } from "@/lib/istatistik";
import { ALAN_ADI, SINAV_TARIHI, dersAdi, kisaTarih, netYaz, tarihYaz, verim } from "@/lib/yks";

const HAFTA_SAYISI = 12;

export const metadata: Metadata = { title: "Öğrenci detayı" };

export default async function OgrenciSayfasi({ params }: PageProps<"/admin/ogrenci/[id]">) {
  const { id } = await params;
  const veri = await ogrenciVerisi(id);
  if (!veri) notFound();

  const { profil, kayitlar, denemeler, bolumler, hedefler } = veri;

  const haftalar = haftalikOzet(kayitlar, denemeler, HAFTA_SAYISI);
  const trend = netTrendi(denemeler);
  const dagilim = dersDagilimi(kayitlar);
  const karsilastirma = hedefKarsilastirma(hedefler, denemeler, bolumler);
  const gun = kalanGun();

  const toplamSoru = kayitlar.reduce((t, k) => t + k.soru, 0);
  const toplamSure = kayitlar.reduce((t, k) => t + (k.sure_dk ?? 0), 0);

  const sonNet = (sinav: "TYT" | "AYT") => {
    const liste = denemeler.filter((d) => d.sinav === sinav);
    return liste.length === 0 ? null : Number(liste[liste.length - 1].toplam_net);
  };

  const hedefMetni =
    [profil.hedef_universite, profil.hedef_bolum].filter(Boolean).join(" — ") || "Hedef belirtilmemiş";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <GeriBaglantisi href="/admin">Tüm öğrenciler</GeriBaglantisi>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-heading">
              {profil.ad_soyad ?? profil.email}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-ink">
              {profil.alan && <Badge>{ALAN_ADI[profil.alan]}</Badge>}
              <span>{profil.email}</span>
              <span aria-hidden="true">·</span>
              <span>{hedefMetni}</span>
              {profil.hedef_siralama && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Hedef sıralama {profil.hedef_siralama.toLocaleString("tr-TR")}</span>
                </>
              )}
            </p>
          </div>

          {gun !== null && (
            <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-warn-soft px-3 py-2">
              <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-sm text-warn">
                Sınava <span className="tabular font-semibold">{gun}</span> gün
                <span className="ml-1 text-xs opacity-80">({tarihYaz(SINAV_TARIHI)})</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Toplam soru" value={toplamSoru.toLocaleString("tr-TR")} />
        <Stat
          label="Toplam süre"
          value={Math.round((toplamSure / 60) * 10) / 10}
          unit="saat"
          sub={`${kayitlar.length} çalışma bloğu`}
        />
        <Stat label="Deneme" value={denemeler.length} />
        <Stat label="Son TYT net" value={netYaz(sonNet("TYT"))} tone="accent" />
        <Stat label="Son AYT net" value={netYaz(sonNet("AYT"))} tone="accent" />
      </div>

      <Card>
        <CardHeader title="Deneme net trendi" description="TYT düz çizgi, AYT kesikli çizgi" />
        <NetTrendGrafigi veri={trend} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Haftalık çözülen soru" description={`Son ${HAFTA_SAYISI} hafta`} />
          <HaftalikSoruGrafigi veri={haftalar} />
        </Card>
        <Card>
          <CardHeader title="Haftalık çalışma süresi" description="Dakika" />
          <HaftalikSureGrafigi veri={haftalar} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Hedef netlere ne kadar yakın?"
          description="Mevcut ortalama, her sınavın son 3 denemesinden hesaplanır."
        />
        {karsilastirma.length === 0 ? (
          <EmptyState title="Hedef net tanımlanmamış" />
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

      <Card>
        <CardHeader title="Ders bazlı soru dağılımı" description="En çok çalıştığı 10 ders" />
        <DersDagilimGrafigi veri={dagilim} />
      </Card>

      <Card>
        <CardHeader title="Denemeler" description={`${denemeler.length} kayıt`} />
        {denemeler.length === 0 ? (
          <EmptyState title="Henüz deneme girilmemiş" />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Tarih</Th>
                <Th>Sınav</Th>
                <Th>Deneme</Th>
                <Th className="text-right">D</Th>
                <Th className="text-right">Y</Th>
                <Th className="text-right">B</Th>
                <Th className="text-right">Toplam net</Th>
                <Th>Değerlendirme</Th>
              </tr>
            </thead>
            <tbody>
              {[...denemeler].reverse().map((d) => (
                <tr key={d.id} className="transition-colors duration-200 hover:bg-canvas">
                  <Td className="tabular whitespace-nowrap">{kisaTarih(d.tarih)}</Td>
                  <Td>
                    <Badge tone={d.sinav === "TYT" ? "tyt" : "ayt"}>{d.sinav}</Badge>
                  </Td>
                  <Td className="font-medium text-heading">
                    {d.ad}
                    {d.yayin && <span className="ml-1 text-xs text-muted-ink">· {d.yayin}</span>}
                  </Td>
                  <Td className="tabular text-right text-muted-ink">{d.toplam_dogru}</Td>
                  <Td className="tabular text-right text-muted-ink">{d.toplam_yanlis}</Td>
                  <Td className="tabular text-right text-muted-ink">{d.toplam_bos}</Td>
                  <Td className="tabular text-right font-semibold text-accent">
                    {netYaz(Number(d.toplam_net))}
                  </Td>
                  <Td className="max-w-[18rem] truncate text-muted-ink" title={d.not_metni ?? ""}>
                    {d.not_metni || "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Günlük çalışma kayıtları"
          description={`${kayitlar.length} kayıt · en yeniden eskiye`}
        />
        {kayitlar.length === 0 ? (
          <EmptyState title="Henüz soru kaydı girilmemiş" />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Tarih</Th>
                <Th>Ders</Th>
                <Th>Konu</Th>
                <Th className="text-right">Soru</Th>
                <Th className="text-right">D</Th>
                <Th className="text-right">Y</Th>
                <Th className="text-right">Net</Th>
                <Th className="text-right">Süre</Th>
                <Th className="text-right">Verim</Th>
                <Th>Not</Th>
              </tr>
            </thead>
            <tbody>
              {kayitlar.slice(0, 200).map((k) => (
                <tr key={k.id} className="transition-colors duration-200 hover:bg-canvas">
                  <Td className="tabular whitespace-nowrap">{kisaTarih(k.tarih)}</Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <Badge tone={k.sinav === "TYT" ? "tyt" : "ayt"}>{k.sinav}</Badge>
                      <span className="whitespace-nowrap">{dersAdi(k.ders)}</span>
                    </span>
                  </Td>
                  <Td className="max-w-[14rem] truncate text-muted-ink" title={k.konu ?? ""}>
                    {k.konu || "—"}
                  </Td>
                  <Td className="tabular text-right font-medium">{k.soru}</Td>
                  <Td className="tabular text-right text-muted-ink">{k.dogru ?? "—"}</Td>
                  <Td className="tabular text-right text-muted-ink">{k.yanlis ?? "—"}</Td>
                  <Td className="tabular text-right font-semibold text-heading">
                    {netYaz(k.net === null ? null : Number(k.net))}
                  </Td>
                  <Td className="tabular text-right text-muted-ink">
                    {k.sure_dk ? `${k.sure_dk} dk` : "—"}
                  </Td>
                  <Td className="tabular text-right text-muted-ink">
                    {netYaz(verim(k.soru, k.sure_dk))}
                  </Td>
                  <Td className="max-w-[16rem] truncate text-muted-ink" title={k.not_metni ?? ""}>
                    {k.not_metni || "—"}
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
