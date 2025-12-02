import { createClient } from '@supabase/supabase-js';

// Supabase - Trillo Conversazioni
const trilloUrl = import.meta.env.VITE_SUPABASE_TRILLO_URL || '';
const trilloKey = import.meta.env.VITE_SUPABASE_TRILLO_ANON_KEY || '';

// Supabase - Conto Economico
const contoUrl = import.meta.env.VITE_SUPABASE_CONTO_URL || '';
const contoKey = import.meta.env.VITE_SUPABASE_CONTO_ANON_KEY || '';

export const supabaseTrillo = createClient(trilloUrl, trilloKey);
export const supabaseConto = createClient(contoUrl, contoKey);

export const isConfigured = !!trilloUrl && !!trilloKey && !!contoUrl && !!contoKey;
