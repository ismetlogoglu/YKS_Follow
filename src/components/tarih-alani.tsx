"use client";

import { useEffect, useRef } from "react";
import { turkiyeBugun } from "@/lib/yks";
import { Input } from "./ui";

/** En geç günü bugüne çeker; dokunulmamış varsayılanı da bugüne alır. */
function alaniTazele(el: HTMLInputElement | null, degistirildi: boolean) {
  if (!el) return;
  const bugun = turkiyeBugun();
  el.max = bugun;
  if (!degistirildi) el.value = bugun;
}

/**
 * Tarih alanı: "bugün"ü ve en geç seçilebilir günü her an tazeler.
 *
 * Sayfa bir kez çizildikten sonra max ve varsayılan değer donuyordu. Tablette
 * sayfa günlerce açık kalınca (uyku → uyanma) en geç gün eski kalıyor, dünü bile
 * seçmek "en çok 2026-09-28 olmalı" uyarısına takılıyordu. Alana dokunulunca,
 * sekme yeniden görünür olunca ve sayfa önbellekten geri gelince güncelliyoruz.
 * Kullanıcının seçtiği tarihe dokunulmuyor; yalnızca hiç değiştirilmemiş
 * varsayılan bugüne çekiliyor, eski güne yanlışlıkla kayıt gitmesin diye.
 *
 * Bilgisayarda takvimi yalnızca küçük simge açıyordu; kutunun herhangi bir yerine
 * tıklamak da açsın diye showPicker(). Dokunmatik ekranda tarayıcı bunu zaten
 * yapıyor, orada ikinci kez açmaya çalışmıyoruz.
 */
export function TarihAlani({ id, name = "tarih" }: { id: string; name?: string }) {
  const alan = useRef<HTMLInputElement>(null);
  const degistirildi = useRef(false);

  useEffect(() => {
    const tazele = () => alaniTazele(alan.current, degistirildi.current);
    tazele();
    const gorununce = () => {
      if (document.visibilityState === "visible") tazele();
    };
    document.addEventListener("visibilitychange", gorununce);
    window.addEventListener("pageshow", tazele);
    window.addEventListener("focus", tazele);
    return () => {
      document.removeEventListener("visibilitychange", gorununce);
      window.removeEventListener("pageshow", tazele);
      window.removeEventListener("focus", tazele);
    };
  }, []);

  return (
    <Input
      ref={alan}
      id={id}
      name={name}
      type="date"
      defaultValue={turkiyeBugun()}
      max={turkiyeBugun()}
      required
      className="cursor-pointer"
      onPointerDown={() => alaniTazele(alan.current, degistirildi.current)}
      onChange={() => {
        degistirildi.current = true;
      }}
      onClick={(e) => {
        if (!window.matchMedia("(pointer: fine)").matches) return;
        try {
          e.currentTarget.showPicker();
        } catch {
          // Eski tarayıcı ya da izin yok: kutu yine elle yazılabilir.
        }
      }}
    />
  );
}
