export interface Call {
  id: string;
  lead_id?: string;
  tenant_id?: string;
  retell_call_id?: string;
  lead_nome: string;
  lead_telefono: string;
  transcript: Array<{ role: 'agent' | 'user'; content: string }> | string;
  esito_qualificazione: string;
  durata_chiamata: number;
  created_at: string;
  riepilogo_chiamata?: string;
  chiamata_completata?: boolean;
  stato_immobile?: string;
  problematiche_immobile?: string;
  urgenza_cliente?: 'alta' | 'media' | 'bassa';
  appuntamento_fissato?: boolean;
  callback_orario?: string;
  callback_motivo?: string;
  sentiment_cliente?: 'positivo' | 'neutro' | 'negativo' | 'ostile';
  obiezioni_cliente?: string;
  note_aggiuntive?: string;
}

export interface Property {
  id: string;
  lead_id?: string;
  created_at: string;
  updated_at: string;
  lead_nome: string;
  lead_cognome?: string;
  lead_email?: string;
  lead_telefono: string;
  indirizzo_completo: string;
  numero_civico?: string;
  tipo_immobile?: string;
  condizioni_immobile?: string;
  superficie_mq?: number;
  numero_locali?: number;
  numero_bagni?: number;
  aree_esterne?: string;
  pertinenze?: string;
  anno_costruzione?: number;
  piano_immobile?: string;
  ascensore?: string;
  prezzo_riferimento?: number;
  prezzo_rivendita?: number;
  prezzo_acquisto?: number;
  roi?: number;
  utile_lordo?: number;
  totale_costi?: number;
  totale_costi_escluso_acquisto?: number;
  offerta_definitiva?: number;
  status: string;
  approved_at?: string;
  closer_notes?: string;
}

export interface LeadSearchResult {
  id: string;
  lead_id?: string;
  type: 'property' | 'call' | 'merged';
  name: string;
  phone: string;
  address?: string;
  lastInteraction: string;
  status?: string;
  hasProperty: boolean;
  hasCall: boolean;
}

export interface LeadFullProfile {
  call: Call | null;
  property: Property | null;
}