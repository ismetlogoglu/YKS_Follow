import type { Metadata } from "next";
import { SoruFormu } from "@/components/soru-formu";
import { SilButonu } from "@/components/sil-butonu";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  GeriBaglantisi,
} from "@/components/ui";
import { gerekliProfil, type CalismaKaydi } from "@/lib/db";
import { dersAdi, kisaTarih, netYaz, verim } from "@/lib/yks";
import { calismaSil } from "./actions";

export const metadata: Metadata = { title: "Soru girişi" };

export default async function SoruSayfasi() {
  const { supabase, user, profil } = await gerekliProfil({ adminiYonlendir: true });

  const { data } = await supabase
    .from("study_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("tarih", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const kayitlar = (data ?? []) as CalismaKaydi[];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <GeriBaglantisi href="/panel">Ana ekran</GeriBaglantisi>
        <h1 className="mt-1 text-2xl font-semibold text-heading">
          Günlük çözülen soru sayısı
        </h1>
        <p className="mt-1 text-sm text-muted-ink">
          Net otomatik hesaplanır: <span className="font-mono">Doğru − Yanlış / 4</span>
        </p>
      </div>

      <SoruFormu alan={profil.alan!} />

      <Card>
        <CardHeader
          title="Son kayıtların"
          description={
            kayitlar.length > 0 ? `En yeni ${kayitlar.length} kayıt gösteriliyor.` : undefined
          }
        />

        {kayitlar.length === 0 ? (
          <EmptyState
            title="Henüz kayıt yok"
            description="Yukarıdaki formu doldurup ilk çalışmanı kaydet. Kaydettiklerin burada listelenir."
          />
        ) : (
          /* Tablo değil liste: 10 sütunluk bir tablo 375px'lik telefonda
             yatay kaydırma gerektiriyordu ve içeriğin yarısı görünmüyordu. */
          <ul className="divide-y divide-line">
            {kayitlar.map((k) => (
              <li
                key={k.id}
                className="flex items-start justify-between gap-3 px-4 py-3 transition-colors duration-200 hover:bg-canvas sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge tone={k.sinav === "TYT" ? "tyt" : "ayt"}>{k.sinav}</Badge>
                    <span className="font-medium text-heading">{dersAdi(k.ders)}</span>
                    <span className="tabular text-sm text-muted-ink">
                      {kisaTarih(k.tarih)}
                    </span>
                  </div>

                  {k.konu && (
                    <p className="mt-0.5 truncate text-sm text-muted-ink" title={k.konu}>
                      {k.konu}
                    </p>
                  )}

                  <dl className="tabular mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-ink">
                    <span className="flex gap-1">
                      <dt>Soru</dt>
                      <dd className="font-semibold text-heading">{k.soru}</dd>
                    </span>
                    {k.dogru !== null && (
                      <span className="flex gap-1">
                        <dt>D</dt>
                        <dd className="font-medium text-ink">{k.dogru}</dd>
                      </span>
                    )}
                    {k.yanlis !== null && (
                      <span className="flex gap-1">
                        <dt>Y</dt>
                        <dd className="font-medium text-ink">{k.yanlis}</dd>
                      </span>
                    )}
                    {k.net !== null && (
                      <span className="flex gap-1">
                        <dt>Net</dt>
                        <dd className="font-semibold text-heading">{netYaz(Number(k.net))}</dd>
                      </span>
                    )}
                    {k.sure_dk !== null && (
                      <span className="flex gap-1">
                        <dt>Süre</dt>
                        <dd className="font-medium text-ink">{k.sure_dk} dk</dd>
                      </span>
                    )}
                    {verim(k.soru, k.sure_dk) !== null && (
                      <span className="flex gap-1">
                        <dt>Verim</dt>
                        <dd className="font-medium text-ink">
                          {netYaz(verim(k.soru, k.sure_dk))}/sa
                        </dd>
                      </span>
                    )}
                  </dl>
                </div>

                <SilButonu action={calismaSil} id={k.id} etiket="Kaydı sil" />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
