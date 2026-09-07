"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAyarlari } from "./ayarlar";

export function createClient() {
  const { url, anonKey } = supabaseAyarlari();
  return createBrowserClient(url, anonKey);
}
