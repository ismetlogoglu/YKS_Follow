import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Download } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Stat,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { HaftalikSoruGrafigi, NetTrendGrafigi } from "@/components/grafikler";
import { adminVerisi, aralikDogrula } from "@/lib/admin";
import { haftalikOzet, kalanGun, netTrendi } from "@/lib/istatistik";
import { ALAN_ADI, SINAV_TARIHI, netYaz, tarihYaz } from "@/lib/yks";

export const metadata: Metadata = { title: "Yönetici paneli" };

export default async function AdminSayfasi({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const { baslangic, bitis } = aralikDogrula(
    typeof sp.baslangic === "string" ? sp.baslangic : null,
    typeof sp.bitis === "string" ? sp.bitis : null,
  );

  const veri = await adminVerisi(baslangic, bitis);
  const haftalar = haftalikOzet(veri.kayitlar, veri.denemeler, 8);
  const trend = netTrendi(veri.denemeler);
  const gun = kalanGun();

  const disaAktarBaglantisi = `/admin/export?baslangic=${baslangic}&bitis=${bitis}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Genel analiz</h1>
          <p className="mt-1 text-sm text-muted-ink">
            {tarihYaz(baslangic)} – {tarihYaz(bitis)} aralığındaki veriler
          </p>
        </div>
        {gun !== null && (
          <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-warn-soft px-3 py-2">
            <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-warn">
              YKS&apos;ye <span className="tabular font-semibold">{gun}</span> gün
              <span className="ml-1 text-xs opacity-80">({tarihYaz(SINAV_TARIHI)})</span>
            </span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader title="Filtrele ve dışa aktar" />
        <form
          method="GET"
          className="flex flex-wrap items-end gap-3 p-4 sm:p-5"
          aria-label="Tarih aralığı filtresi"
        >
          <Field label="Başlangıç" htmlFor="baslangic" className="w-44">
            <Input id="baslangic" name="baslangic" type="date" defaultValue={baslangic} />
          </Field>
          <Field label="Bitiş" htmlFor="bitis" className="w-44">
            <Input id="bitis" name="bitis" type="date" defaultValue={bitis} />
          </Field>
          <Button type="submit">Uygula</Button>

          <div className="ml-auto">
            {/* Route handler dosyayı indirilir olarak döndürür. */}
            <a href={disaAktarBaglantisi} download>
              <Button type="button" variant="secondary">
                <Download className="h-4 w-4" aria-hidden="true" />
                Excel olarak indir
              </Button>
            </a>
          </div>
        </form>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Kayıtlı öğrenci" value={veri.toplam.kullanici} />
        <Stat
          label="Aktif öğrenci"
          value={veri.toplam.aktifOgrenci}
          sub="Aralıkta veri girenler"
        />
        <Stat label="Toplam soru" value={veri.toplam.soru.toLocaleString("tr-TR")} />
        <Stat
          label="Toplam süre"
          value={Math.round((veri.toplam.sure / 60) * 10) / 10}
          unit="saat"
        />
        <Stat label="TYT ort. net" value={netYaz(veri.toplam.tytOrt)} tone="accent" />
        <Stat label="AYT ort. net" value={netYaz(veri.toplam.aytOrt)} tone="accent" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Haftalık toplam soru" description="Tüm öğrenciler, son 8 hafta" />
          <HaftalikSoruGrafigi veri={haftalar} />
        </Card>
        <Card>
          <CardHeader title="Deneme net ortalaması" description="Günlük ortalama, tüm öğrenciler" />
          <NetTrendGrafigi veri={trend} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Öğrenciler"
          description={`${veri.ogrenciler.length} kayıtlı öğrenci · ${veri.toplam.deneme} deneme · detay için isme tıkla`}
        />

        {veri.ogrenciler.length === 0 ? (
          <EmptyState title="Henüz kayıtlı öğrenci yok" />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Öğrenci</Th>
                <Th>Alan</Th>
                <Th>Hedef</Th>
                <Th className="text-right">Soru</Th>
                <Th className="text-right">Süre (dk)</Th>
                <Th className="text-right">Blok</Th>
                <Th className="text-right">Deneme</Th>
                <Th className="text-right">TYT ort.</Th>
                <Th className="text-right">AYT ort.</Th>
                <Th>Son aktivite</Th>
              </tr>
            </thead>
            <tbody>
              {veri.ogrenciler.map((o) => (
                <tr key={o.profil.id} className="transition-colors duration-200 hover:bg-canvas">
                  <Td>
                    <Link
                      href={`/admin/ogrenci/${o.profil.id}`}
                      className="block font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {o.profil.ad_soyad ?? o.profil.email ?? "—"}
                    </Link>
                    <p className="text-xs text-muted-ink">{o.profil.email}</p>
                  </Td>
                  <Td>
                    {o.profil.alan ? (
                      <Badge>{ALAN_ADI[o.profil.alan]}</Badge>
                    ) : (
                      <span className="text-xs text-muted-ink">Kurulum yok</span>
                    )}
                  </Td>
                  <Td className="max-w-[14rem] truncate text-muted-ink">
                    {[o.profil.hedef_universite, o.profil.hedef_bolum].filter(Boolean).join(" — ") ||
                      "—"}
                  </Td>
                  <Td className="tabular text-right font-semibold text-heading">{o.soru}</Td>
                  <Td className="tabular text-right text-muted-ink">{o.sure}</Td>
                  <Td className="tabular text-right text-muted-ink">{o.blok}</Td>
                  <Td className="tabular text-right text-muted-ink">{o.denemeSayisi}</Td>
                  <Td className="tabular text-right">{netYaz(o.tytOrt)}</Td>
                  <Td className="tabular text-right">{netYaz(o.aytOrt)}</Td>
                  <Td className="tabular whitespace-nowrap text-muted-ink">
                    {o.sonAktivite ? tarihYaz(o.sonAktivite) : "—"}
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
