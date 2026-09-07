import type { Metadata } from "next";
import { KayitFormu } from "@/components/auth-forms";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Kayıt ol" };

export default function KayitSayfasi() {
  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold text-heading">Hesap oluştur</h1>
      <p className="mt-1 mb-6 text-sm text-muted-ink">
        Kaydolduktan sonra alanını ve net hedeflerini belirleyeceksin.
      </p>
      <KayitFormu />
    </Card>
  );
}
