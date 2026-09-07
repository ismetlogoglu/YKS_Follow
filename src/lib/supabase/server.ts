import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAyarlari } from "./ayarlar";

/**
 * Server Component / Server Action / Route Handler istemcisi.
 * Next 16'da cookies() asenkron olduğu için bu fonksiyon await edilmelidir.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseAyarlari();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component içinden çağrıldığında cookie yazılamaz.
          // Oturum yenilemesi proxy.ts tarafından yapıldığı için bu güvenle yutulabilir.
        }
      },
    },
  });
}
