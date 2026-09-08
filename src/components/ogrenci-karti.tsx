import { ChevronRight } from "lucide-react";
import { YuklenenBaglanti } from "./yuklenen-baglanti";
import { Badge, Card } from "./ui";
import type { OgrenciOzeti } from "@/lib/admin";
import { ALAN_ADI, netYaz, tarihYaz } from "@/lib/yks";

/** Kart içindeki tek metrik. Değeri olmayanlar tire ile gösterilir, gizlenmez. */
function Metrik({
  etiket,
  deger,
  alt,
  vurgu,
}: {
  etiket: string;
  deger: string;
  alt?: string;
  vurgu?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] leading-tight tracking-wide text-muted-ink uppercase">
        {etiket}
      </p>
      <p
        className={`tabular text-lg leading-tight font-semibold ${vurgu ? "text-accent" : "text-heading"}`}
      >
        {deger}
      </p>
      {alt && <p className="text-[11px] leading-tight text-muted-ink">{alt}</p>}
    </div>
  );
}

function degisimYazi(degisim: number | null): { metin: string; ton: "success" | "danger" } | null {
  if (degisim === null || degisim === 0) return null;
  return {
    metin: `${degisim > 0 ? "▲" : "▼"} ${netYaz(Math.abs(degisim))} net`,
    ton: degisim > 0 ? "success" : "danger",
  };
}

export function OgrenciKarti({ o }: { o: OgrenciOzeti }) {
  const tytDegisim = degisimYazi(o.tyt.degisim);
  const aytDegisim = degisimYazi(o.ayt.degisim);
  const hedefBilgisi = o.hedefte + o.geride > 0;

  return (
    <Card className="transition-colors duration-200 hover:border-secondary">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <YuklenenBaglanti
            href={`/admin/ogrenci/${o.profil.id}`}
            gostergeEtiketi="Öğrenci analizi açılıyor"
            className="inline-flex items-center gap-2 text-base font-semibold text-primary underline-offset-2 hover:underline"
          >
            {o.profil.ad_soyad ?? o.profil.email ?? "İsimsiz öğrenci"}
          </YuklenenBaglanti>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-ink">
            {o.profil.alan ? (
              <Badge>{ALAN_ADI[o.profil.alan]}</Badge>
            ) : (
              <Badge tone="warn">Kurulum yapılmadı</Badge>
            )}
            <span className="truncate">{o.profil.email}</span>
            {(o.profil.hedef_universite || o.profil.hedef_bolum) && (
              <span className="truncate">
                ·{" "}
                {[o.profil.hedef_universite, o.profil.hedef_bolum].filter(Boolean).join(" — ")}
              </span>
            )}
          </p>
        </div>

        <p className="text-right text-xs text-muted-ink">
          Son aktivite
          <span className="tabular block font-medium text-heading">
            {o.sonAktivite ? tarihYaz(o.sonAktivite) : "—"}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metrik
          etiket="Son 10 TYT"
          deger={netYaz(o.tyt.sonNOrtalama)}
          alt={`${o.tyt.adet} deneme`}
          vurgu
        />
        <Metrik
          etiket="Son 10 AYT"
          deger={netYaz(o.ayt.sonNOrtalama)}
          alt={`${o.ayt.adet} deneme`}
          vurgu
        />
        <Metrik
          etiket="Genel TYT"
          deger={netYaz(o.tyt.genelOrtalama)}
          alt={o.tyt.enIyi === null ? undefined : `en iyi ${netYaz(o.tyt.enIyi)}`}
        />
        <Metrik
          etiket="Genel AYT"
          deger={netYaz(o.ayt.genelOrtalama)}
          alt={o.ayt.enIyi === null ? undefined : `en iyi ${netYaz(o.ayt.enIyi)}`}
        />
        <Metrik
          etiket="Aralıkta soru"
          deger={o.soru.toLocaleString("tr-TR")}
          alt={`${Math.round((o.sure / 60) * 10) / 10} saat · ${o.blok} blok`}
        />
        <Metrik
          etiket="Aralıkta deneme"
          deger={String(o.denemeSayisi)}
          alt={`${o.veriYok > 0 ? `${o.veriYok} derste veri yok` : "tüm derslerde veri var"}`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {hedefBilgisi ? (
            <>
              <Badge tone="success">{o.hedefte} ders hedefte</Badge>
              {o.geride > 0 && (
                <Badge tone="warn">
                  {o.geride} ders geride · toplam {netYaz(o.toplamAcik)} net açık
                </Badge>
              )}
              {tytDegisim && (
                <Badge tone={tytDegisim.ton}>TYT gidişat {tytDegisim.metin}</Badge>
              )}
              {aytDegisim && (
                <Badge tone={aytDegisim.ton}>AYT gidişat {aytDegisim.metin}</Badge>
              )}
            </>
          ) : (
            <span className="text-muted-ink">
              Hedef karşılaştırması için henüz yeterli deneme yok.
            </span>
          )}
        </div>

        <YuklenenBaglanti
          href={`/admin/ogrenci/${o.profil.id}`}
          gostergeEtiketi="Öğrenci analizi açılıyor"
          className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium text-heading transition-colors duration-200 hover:bg-muted"
        >
          Detaylı analiz
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </YuklenenBaglanti>
      </div>
    </Card>
  );
}
