"use client";

import { useEffect } from "react";

/**
 * Chrome'da odaklanmış bir <input type="number"> üzerinde sayfayı kaydırmak
 * değeri sessizce değiştirir. Öğrenci doğru/yanlış girip sayfayı kaydırdığında
 * verisi bozulmasın diye tekerlek hareketinde odağı bırakıyoruz.
 */
export function SayiKorumasi() {
  useEffect(() => {
    const wheel = () => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement && el.type === "number") el.blur();
    };
    document.addEventListener("wheel", wheel, { passive: true, capture: true });
    return () => document.removeEventListener("wheel", wheel, { capture: true });
  }, []);

  return null;
}
