import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Oturum gerektiren bölümler. */
const KORUMALI = ["/panel", "/kurulum", "/admin"];
/** Girişliyken görülmemesi gereken sayfalar. */
const SADECE_MISAFIR = ["/giris", "/kayit"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Ayarlar eksikse isteği olduğu gibi geçir; sayfa katmanı anlaşılır bir hata gösterir.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() süresi dolmuş token'ı tazeler; bu çağrı kaldırılırsa oturumlar
  // sessizce düşer. getSession() sunucuda doğrulanmadığı için kullanılmıyor.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && KORUMALI.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("devam", pathname);
    return NextResponse.redirect(url);
  }

  if (user && SADECE_MISAFIR.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Statik dosyalar ve resim optimizasyonu dışındaki her istek.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
