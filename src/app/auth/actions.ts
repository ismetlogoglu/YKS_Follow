"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

const girisSemasi = z.object({
  email: z.email({ message: "Geçerli bir e-posta adresi gir." }),
  sifre: z.string().min(1, "Şifreni gir."),
});

const kayitSemasi = z.object({
  adSoyad: z.string().trim().min(2, "Adını ve soyadını yaz."),
  email: z.email({ message: "Geçerli bir e-posta adresi gir." }),
  sifre: z.string().min(8, "Şifre en az 8 karakter olmalı."),
});

/** Supabase'in İngilizce hata mesajlarını okunur Türkçeye çevirir. */
function ceviriHata(mesaj: string): string {
  const m = mesaj.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed"))
    return "E-postanı henüz doğrulamadın. Gelen kutunu kontrol et.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.";
  if (m.includes("password should be at least")) return "Şifre en az 8 karakter olmalı.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.";
  return "Bir şeyler ters gitti. Lütfen tekrar dene.";
}

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function girisYap(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = girisSemasi.safeParse({
    email: formData.get("email"),
    sifre: formData.get("sifre"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.sifre,
  });

  if (error) return { error: ceviriHata(error.message) };

  const devam = String(formData.get("devam") ?? "");
  revalidatePath("/", "layout");
  redirect(devam.startsWith("/") ? devam : "/panel");
}

export async function kayitOl(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = kayitSemasi.safeParse({
    adSoyad: formData.get("adSoyad"),
    email: formData.get("email"),
    sifre: formData.get("sifre"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.sifre,
    options: {
      data: { ad_soyad: parsed.data.adSoyad },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: ceviriHata(error.message) };

  // E-posta doğrulaması açıksa oturum hemen açılmaz; kullanıcıyı bilgilendir.
  if (!data.session) {
    return {
      info: `${parsed.data.email} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra profilini oluşturabilirsin.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/kurulum");
}

export async function googleIleGiris() {
  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/giris?hata=google");
  }
  redirect(data.url);
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/giris");
}
