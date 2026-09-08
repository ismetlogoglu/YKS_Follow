"use client";

import { Trash } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, Spinner } from "./ui";

function Ikon({ etiket }: { etiket: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="text-muted-ink hover:bg-danger-soft hover:text-danger"
      disabled={pending}
      aria-busy={pending}
      title={etiket}
    >
      {pending ? <Spinner /> : <Trash className="h-4 w-4" aria-hidden="true" />}
      <span className="sr-only">{pending ? "Siliniyor…" : etiket}</span>
    </Button>
  );
}

/**
 * Silme geri alınamaz olduğu için gönderimden önce onay ister.
 * Onay reddedilirse form gönderimi iptal edilir.
 */
export function SilButonu({
  action,
  id,
  etiket = "Sil",
  soru = "Bu kaydı silmek istediğine emin misin? Bu işlem geri alınamaz.",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  etiket?: string;
  soru?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(soru)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Ikon etiket={etiket} />
    </form>
  );
}
