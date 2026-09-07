"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { girisYap, kayitOl, googleIleGiris, type AuthState } from "@/app/auth/actions";
import { Alert, Button, Field, Input } from "./ui";

const BOS: AuthState = {};

function GonderButonu({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? "Gönderiliyor…" : children}
    </Button>
  );
}

function GoogleButonu() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={pending}
      aria-busy={pending}
    >
      <svg viewBox="0 0 18 18" className="h-4.5 w-4.5" aria-hidden="true" focusable="false">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
        />
      </svg>
      {pending ? "Yönlendiriliyor…" : "Google ile devam et"}
    </Button>
  );
}

function Ayirac() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs text-muted-ink">veya</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function GirisFormu({
  devam,
  uyari,
  uyariTonu = "danger",
}: {
  devam?: string;
  uyari?: string;
  uyariTonu?: "danger" | "success";
}) {
  const [state, formAction] = useActionState(girisYap, BOS);

  return (
    <div className="flex flex-col gap-5">
      {uyari && <Alert tone={uyariTonu}>{uyari}</Alert>}
      {state.error && <Alert tone="danger">{state.error}</Alert>}

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="devam" value={devam ?? ""} />

        <Field label="E-posta" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="ornek@mail.com"
            required
          />
        </Field>

        <Field label="Şifre" htmlFor="sifre" required>
          <Input
            id="sifre"
            name="sifre"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        <GonderButonu>Giriş yap</GonderButonu>
      </form>

      <Ayirac />

      <form action={googleIleGiris}>
        <GoogleButonu />
      </form>

      <p className="text-center text-sm text-muted-ink">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-primary underline underline-offset-2">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}

export function KayitFormu() {
  const [state, formAction] = useActionState(kayitOl, BOS);

  if (state.info) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success" title="Kaydın alındı">
          {state.info}
        </Alert>
        <Link href="/giris">
          <Button variant="outline" size="lg" className="w-full">
            Giriş sayfasına dön
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {state.error && <Alert tone="danger">{state.error}</Alert>}

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Ad Soyad" htmlFor="adSoyad" required>
          <Input id="adSoyad" name="adSoyad" autoComplete="name" required />
        </Field>

        <Field label="E-posta" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="ornek@mail.com"
            required
          />
        </Field>

        <Field label="Şifre" htmlFor="sifre" hint="En az 8 karakter." required>
          <Input
            id="sifre"
            name="sifre"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>

        <GonderButonu>Hesap oluştur</GonderButonu>
      </form>

      <Ayirac />

      <form action={googleIleGiris}>
        <GoogleButonu />
      </form>

      <p className="text-center text-sm text-muted-ink">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-primary underline underline-offset-2">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
