import type { Metadata } from "next";
import { SoruFormu } from "@/components/soru-formu";
import { SilButonu } from "@/components/sil-butonu";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Td,
  Th,
  TableWrap,
} from "@/components/ui";
import { gerekliProfil, type CalismaKaydi } from "@/lib/db";
import { dersAdi, kisaTarih, netYaz, verim } from "@/lib/yks";
import { calismaSil } from "./actions";

export const metadata: Metadata = { title: "Soru girişi" };

export default async function SoruSayfasi() {
  const { supabase, user, profil } = await gerekliProfil();

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
        <h1 className="text-2xl font-semibold text-heading">Soru girişi</h1>
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
            description="Yukarıdaki formu doldurup ilk çalışmanı kaydet; grafikler ilk kayıttan sonra oluşmaya başlar."
          />
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
                <Th>
                  <span className="sr-only">İşlem</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {kayitlar.map((k) => (
                <tr key={k.id} className="transition-colors duration-200 hover:bg-canvas">
                  <Td className="tabular whitespace-nowrap">{kisaTarih(k.tarih)}</Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <Badge tone={k.sinav === "TYT" ? "tyt" : "ayt"}>{k.sinav}</Badge>
                      <span className="whitespace-nowrap">{dersAdi(k.ders)}</span>
                    </span>
                  </Td>
                  <Td className="max-w-[16rem] truncate text-muted-ink" title={k.konu ?? ""}>
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
                  <Td className="text-right">
                    <SilButonu action={calismaSil} id={k.id} etiket="Kaydı sil" />
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
