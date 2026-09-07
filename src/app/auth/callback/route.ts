import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Google girişi ve e-posta doğrulama bağlantıları buraya döner.
 * Supabase yapılandırmasına göre ya `code` (PKCE) ya da `token_hash` gelir.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let hata: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    hata = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    hata = error?.message ?? null;
  } else {
    hata = "Doğrulama bağlantısı eksik veya geçersiz.";
  }

  if (hata) {
    return NextResponse.redirect(new URL("/giris?hata=dogrulama", origin));
  }

  // Profil kurulumu tamamlanmamışsa kullanıcıyı doğrudan kuruluma al.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("kurulum_tamam")
      .eq("id", user.id)
      .maybeSingle();

    if (!profil?.kurulum_tamam) {
      return NextResponse.redirect(new URL("/kurulum", origin));
    }
  }

  return NextResponse.redirect(new URL("/panel", origin));
}
