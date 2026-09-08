import type { Metadata } from "next";
import { CalendarDays, Download } from "lucide-react";
import { Button, Card, CardHeader, EmptyState, Field, Input, Stat } from "@/components/ui";
import { OgrenciKarti } from "@/components/ogrenci-karti";
import { adminVerisi, aralikDogrula } from "@/lib/admin";
import { kalanGun } from "@/lib/istatistik";
import { SINAV_TARIHI, tarihYaz } from "@/lib/yks";

export const metadata: Metadata = { title: "Yönetici paneli" };

export default async function AdminSayfasi({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const { baslangic, bitis } = aralikDogrula(
    typeof sp.baslangic === "string" ? sp.baslangic : null,
    typeof sp.bitis === "string" ? sp.bitis : null,
  );

  const veri = await adminVerisi(baslangic, bitis);
  const gun = kalanGun();

  // Aktivitesi olmayan öğrenciler listenin sonuna düşsün.
  const ogrenciler = [...veri.ogrenciler].sort(
    (a, b) => (b.sonAktivite ?? "").localeCompare(a.sonAktivite ?? ""),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Öğrenciler</h1>
          <p className="mt-1 text-sm text-muted-ink">
            Net ortalamaları tüm denemeler üzerinden · soru ve süre {tarihYaz(baslangic)} –{" "}
            {tarihYaz(bitis)} aralığından
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Kayıtlı öğrenci" value={veri.toplam.kullanici} />
        <Stat
          label="Aralıkta aktif"
          value={veri.toplam.aktifOgrenci}
          sub="veri giren öğrenci"
        />
        <Stat label="Aralıkta soru" value={veri.toplam.soru.toLocaleString("tr-TR")} />
        <Stat label="Aralıkta deneme" value={veri.toplam.deneme} />
      </div>

      <Card>
        <CardHeader title="Tarih aralığı ve dışa aktarma" />
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
            <a href={`/admin/export?baslangic=${baslangic}&bitis=${bitis}`} download>
              <Button type="button" variant="secondary">
                <Download className="h-4 w-4" aria-hidden="true" />
                Excel olarak indir
              </Button>
            </a>
          </div>
        </form>
      </Card>

      {ogrenciler.length === 0 ? (
        <Card>
          <EmptyState
            title="Henüz kayıtlı öğrenci yok"
            description="Öğrencilerin siteye kaydolup profil kurulumunu tamamladığında burada görünürler."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {ogrenciler.map((o) => (
            <OgrenciKarti key={o.profil.id} o={o} />
          ))}
        </div>
      )}
    </div>
  );
}
