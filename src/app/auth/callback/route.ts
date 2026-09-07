import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Kullanıcıyı giriş sayfasına, açıklayıcı bir mesajla geri yollar. */
function girise(origin: string, hata: string) {
  return NextResponse.redirect(new URL(`/giris?hata=${hata}`, origin));
}

/**
 * Google girişi ve e-posta doğrulama bağlantıları buraya döner.
 * Supabase yapılandırmasına göre ya `code` (PKCE) ya da `token_hash` gelir.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  // Supabase bağlantı bozuksa hatayı sorgu parametresi olarak gönderir.
  const gotrueHata = searchParams.get("error_code") ?? searchParams.get("error");
  if (gotrueHata) {
    return girise(origin, gotrueHata.includes("expired") ? "suresi_doldu" : "dogrulama");
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Bağlantı geçerliydi ve Supabase e-postayı zaten doğruladı; başarısız olan
      // yalnızca oturum devri. PKCE doğrulayıcısı kaydın yapıldığı tarayıcıda
      // saklanır — link başka bir tarayıcıda veya telefonda açıldıysa burası çalışır.
      return girise(origin, "oturum_devri");
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return girise(origin, "dogrulama");
  } else {
    return girise(origin, "dogrulama");
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
