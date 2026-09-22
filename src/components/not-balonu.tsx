"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Konum = { left: number; width: number } & ({ top: number } | { bottom: number });

/**
 * Tablodaki kısaltılmış bir notu tıklayınca tam metniyle gösteren balon.
 *
 * Balon document.body'ye taşınıyor: tablo overflow-x-auto bir kabın içinde, balon
 * hücrenin içinde kalsaydı kap onu kırpardı. Konum tıklanan yazıya göre sabit
 * (fixed) hesaplanıyor; sayfa kayarsa balon yerinden kopmasın diye kapanıyor.
 */
export function NotBalonu({ metin, baslik }: { metin: string; baslik: string }) {
  const [konum, setKonum] = useState<Konum | null>(null);
  const tetik = useRef<HTMLButtonElement>(null);
  const balon = useRef<HTMLDivElement>(null);
  const kapat = useRef<HTMLButtonElement>(null);
  const kimlik = useId();
  const acik = konum !== null;

  function ac() {
    const r = tetik.current!.getBoundingClientRect();
    const width = Math.min(352, window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.left), window.innerWidth - width - 12);
    // Ekranın alt kısmındaysa yukarı doğru aç, yoksa aşağı taşıp görünmez olur.
    setKonum(
      r.bottom > window.innerHeight * 0.6
        ? { left, width, bottom: window.innerHeight - r.top + 8 }
        : { left, width, top: r.bottom + 8 },
    );
  }

  useEffect(() => {
    if (!acik) return;
    kapat.current?.focus();

    const kapa = () => setKonum(null);
    const disaridan = (e: PointerEvent) => {
      const hedef = e.target as Node;
      if (balon.current?.contains(hedef) || tetik.current?.contains(hedef)) return;
      kapa();
    };
    const tus = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      kapa();
      tetik.current?.focus();
    };

    document.addEventListener("pointerdown", disaridan);
    document.addEventListener("keydown", tus);
    window.addEventListener("scroll", kapa, true);
    window.addEventListener("resize", kapa);
    return () => {
      document.removeEventListener("pointerdown", disaridan);
      document.removeEventListener("keydown", tus);
      window.removeEventListener("scroll", kapa, true);
      window.removeEventListener("resize", kapa);
    };
  }, [acik]);

  return (
    <>
      <button
        ref={tetik}
        type="button"
        onClick={() => (acik ? setKonum(null) : ac())}
        aria-expanded={acik}
        aria-controls={acik ? kimlik : undefined}
        title="Notun tamamını göster"
        className="block max-w-[16rem] cursor-pointer truncate text-left text-muted-ink underline decoration-line-strong decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-primary hover:decoration-primary"
      >
        {metin}
      </button>

      {acik &&
        createPortal(
          <div
            ref={balon}
            id={kimlik}
            role="dialog"
            aria-labelledby={`${kimlik}-baslik`}
            style={konum}
            className="fixed z-50 rounded-[10px] border border-line-strong bg-surface shadow-lg"
          >
            <div className="flex items-center justify-between gap-2 border-b border-line py-1.5 pr-1.5 pl-3">
              <p id={`${kimlik}-baslik`} className="truncate text-xs font-semibold text-heading">
                {baslik}
              </p>
              <button
                ref={kapat}
                type="button"
                onClick={() => {
                  setKonum(null);
                  tetik.current?.focus();
                }}
                aria-label="Kapat"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-ink transition-colors duration-200 hover:bg-muted hover:text-heading"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="max-h-72 overflow-y-auto px-3 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink">
              {metin}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
