"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash } from "lucide-react";
import { Button, Spinner } from "./ui";

/** Silme aksiyonlarının dönüşü; `hata` doluysa kayıt silinmemiştir. */
export type SilmeDurumu = { hata?: string };

/**
 * Silme geri alınamaz; çöp kutusuna ilk dokunuş aynı yerde "Silinsin mi?" onayını açar.
 *
 * Tarayıcının window.confirm penceresi bilerek kullanılmıyor: bazı uygulama içi
 * tarayıcılar (Instagram vb.) onu hiç göstermeden "hayır" sayıyor ve düğme hiçbir
 * şey yapmıyormuş gibi görünüyordu.
 *
 * JavaScript çalışmayan telefonda çöp kutusu formu doğrudan gönderir (onaysız) —
 * eski cihazda hiç silememekten iyidir.
 */
export function SilButonu({
  action,
  id,
  etiket = "Sil",
}: {
  action: (onceki: SilmeDurumu, formData: FormData) => Promise<SilmeDurumu>;
  id: string;
  etiket?: string;
}) {
  const [durum, calistir, bekliyor] = useActionState(action, {});
  const [onay, setOnay] = useState(false);
  const vazgec = useRef<HTMLButtonElement>(null);

  // Klavyeyle gelen kişi yanlışlıkla Enter'a basıp silmesin diye odak "Vazgeç"te.
  useEffect(() => {
    if (onay) vazgec.current?.focus();
  }, [onay]);

  return (
    <form action={calistir} className="flex shrink-0 flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />

      {onay ? (
        <>
          <p className="text-xs font-medium text-heading">Silinsin mi?</p>
          <div className="flex items-center gap-2">
            <Button
              ref={vazgec}
              type="button"
              variant="outline"
              size="md"
              className="px-3"
              disabled={bekliyor}
              onClick={() => setOnay(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              className="px-3"
              disabled={bekliyor}
              aria-busy={bekliyor}
            >
              {bekliyor && <Spinner />}
              {bekliyor ? "Siliniyor…" : "Sil"}
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="submit"
          variant="ghost"
          /* md = 44px: sm (36px) telefonda dokunma hedefi alt sınırının altında kalıyordu. */
          size="md"
          className="px-3 text-muted-ink hover:bg-danger-soft hover:text-danger"
          title={etiket}
          onClick={(e) => {
            e.preventDefault();
            setOnay(true);
          }}
        >
          <Trash className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{etiket}</span>
        </Button>
      )}

      {durum.hata && (
        <p role="alert" className="max-w-[14rem] text-right text-xs text-danger">
          {durum.hata}
        </p>
      )}
    </form>
  );
}
