/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_TRILLO_URL: string;
  readonly VITE_SUPABASE_TRILLO_ANON_KEY: string;
  readonly VITE_SUPABASE_CONTO_URL: string;
  readonly VITE_SUPABASE_CONTO_ANON_KEY: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}