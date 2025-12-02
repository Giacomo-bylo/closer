# Closer Bylo

Pre-CRM per i closer di Bylo. Permette di cercare lead e visualizzare in un'unica scheda:
- Conversazione con Chiara (setter AI)
- Valutazione immobile

## Setup

1. Clona il repository
2. Installa dipendenze: `npm install`
3. Copia `.env.example` in `.env.local` e configura le variabili Supabase
4. Avvia: `npm run dev`

## Deploy su Vercel

1. Collega il repository a Vercel
2. Configura le variabili d'ambiente:
   - `VITE_SUPABASE_TRILLO_URL`
   - `VITE_SUPABASE_TRILLO_ANON_KEY`
   - `VITE_SUPABASE_CONTO_URL`
   - `VITE_SUPABASE_CONTO_ANON_KEY`
3. Deploy automatico su push

## Stack

- React 18 + TypeScript
- Tailwind CSS
- Supabase (2 progetti)
- Vite
- Vercel
