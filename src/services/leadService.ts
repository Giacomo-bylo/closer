import { supabaseTrillo, supabaseConto } from '@/lib/supabase';
import { Call, Property, LeadSearchResult, LeadFullProfile } from '@/types';

export const getAllLeads = async (): Promise<LeadSearchResult[]> => {
  const { data: properties, error: propError } = await supabaseConto
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (propError) console.error("Properties fetch error", propError);

  const { data: calls, error: callError } = await supabaseTrillo
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false });

  if (callError) console.error("Calls fetch error", callError);

  const resultsMap = new Map<string, LeadSearchResult>();

  properties?.forEach((p: Property) => {
    const key = p.lead_id || (p.lead_telefono ? p.lead_telefono.replace(/\s/g, '') : `prop_${p.id}`);
    
    resultsMap.set(key, {
      id: p.id,
      lead_id: p.lead_id,
      type: 'property',
      name: `${p.lead_nome} ${p.lead_cognome || ''}`.trim(),
      phone: p.lead_telefono,
      address: p.indirizzo_completo,
      lastInteraction: p.updated_at || p.created_at,
      status: p.status === 'approved' ? 'Approvato' : 'In attesa',
      hasProperty: true,
      hasCall: false,
    });
  });

  calls?.forEach((c: Call) => {
    const key = c.lead_id || (c.lead_telefono ? c.lead_telefono.replace(/\s/g, '') : `call_${c.id}`);
    const existing = resultsMap.get(key);

    if (existing) {
      existing.hasCall = true;
      existing.status = c.esito_qualificazione;
      if (new Date(c.created_at) > new Date(existing.lastInteraction)) {
        existing.lastInteraction = c.created_at;
      }
    } else {
      resultsMap.set(key, {
        id: c.id,
        lead_id: c.lead_id,
        type: 'call',
        name: c.lead_nome,
        phone: c.lead_telefono,
        address: undefined,
        lastInteraction: c.created_at,
        status: c.esito_qualificazione,
        hasProperty: false,
        hasCall: true,
      });
    }
  });

  return Array.from(resultsMap.values()).sort((a, b) => 
    new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
  );
};

export const searchLeads = async (query: string): Promise<LeadSearchResult[]> => {
  if (!query || query.length < 2) return [];

  const cleanQuery = query.trim();
  const isPhone = /^\+?[0-9\s]+$/.test(cleanQuery);

  let propQuery = supabaseConto.from('properties').select('*');
  
  if (isPhone) {
    propQuery = propQuery.ilike('lead_telefono', `%${cleanQuery}%`);
  } else {
    propQuery = propQuery.or(`lead_nome.ilike.%${cleanQuery}%,lead_cognome.ilike.%${cleanQuery}%,indirizzo_completo.ilike.%${cleanQuery}%`);
  }
  
  const { data: properties, error: propError } = await propQuery;
  if (propError) console.error("Property search error", propError);

  let callQuery = supabaseTrillo.from('calls').select('*');

  if (isPhone) {
    callQuery = callQuery.ilike('lead_telefono', `%${cleanQuery}%`);
  } else {
    callQuery = callQuery.ilike('lead_nome', `%${cleanQuery}%`);
  }

  const { data: calls, error: callError } = await callQuery;
  if (callError) console.error("Call search error", callError);

  const resultsMap = new Map<string, LeadSearchResult>();

  properties?.forEach((p: Property) => {
    const key = p.lead_id || (p.lead_telefono ? p.lead_telefono.replace(/\s/g, '') : `prop_${p.id}`);
    
    resultsMap.set(key, {
      id: p.id,
      lead_id: p.lead_id,
      type: 'property',
      name: `${p.lead_nome} ${p.lead_cognome || ''}`.trim(),
      phone: p.lead_telefono,
      address: p.indirizzo_completo,
      lastInteraction: p.updated_at || p.created_at,
      status: p.status === 'approved' ? 'Approvato' : 'In attesa',
      hasProperty: true,
      hasCall: false,
    });
  });

  calls?.forEach((c: Call) => {
    const key = c.lead_id || (c.lead_telefono ? c.lead_telefono.replace(/\s/g, '') : `call_${c.id}`);
    const existing = resultsMap.get(key);

    if (existing) {
      existing.hasCall = true;
      existing.status = c.esito_qualificazione;
      if (new Date(c.created_at) > new Date(existing.lastInteraction)) {
        existing.lastInteraction = c.created_at;
      }
    } else {
      resultsMap.set(key, {
        id: c.id,
        lead_id: c.lead_id,
        type: 'call',
        name: c.lead_nome,
        phone: c.lead_telefono,
        address: undefined,
        lastInteraction: c.created_at,
        status: c.esito_qualificazione,
        hasProperty: false,
        hasCall: true,
      });
    }
  });

  return Array.from(resultsMap.values()).sort((a, b) => 
    new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
  );
};

export const getLeadDetails = async (id: string): Promise<LeadFullProfile> => {
  let call: Call | null = null;
  let property: Property | null = null;
  let leadId: string | null = null;
  let phoneNumber: string | null = null;

  const { data: propData } = await supabaseConto
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (propData) {
    property = propData as Property;
    leadId = property.lead_id || null;
    phoneNumber = property.lead_telefono;
  } else {
    const { data: callData } = await supabaseTrillo
      .from('calls')
      .select('*')
      .eq('id', id)
      .single();
    
    if (callData) {
      call = callData as Call;
      leadId = call.lead_id || null;
      phoneNumber = call.lead_telefono;
    }
  }

  if (!property && !call) {
    throw new Error("Lead non trovato");
  }

  if (leadId) {
    if (!property) {
      const { data: p } = await supabaseConto
        .from('properties')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (p && p.length > 0) property = p[0] as Property;
    }

    if (!call) {
      const { data: c } = await supabaseTrillo
        .from('calls')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (c && c.length > 0) {
        const qualified = c.find((x: Call) => x.esito_qualificazione === 'qualificato');
        call = (qualified || c[0]) as Call;
      }
    }
  } else if (phoneNumber) {
    if (!property) {
      const { data: p } = await supabaseConto
        .from('properties')
        .select('*')
        .ilike('lead_telefono', `%${phoneNumber}%`)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (p && p.length > 0) property = p[0] as Property;
    }

    if (!call) {
      const { data: c } = await supabaseTrillo
        .from('calls')
        .select('*')
        .ilike('lead_telefono', `%${phoneNumber}%`)
        .order('created_at', { ascending: false });

      if (c && c.length > 0) {
        const qualified = c.find((x: Call) => x.esito_qualificazione === 'qualificato');
        call = (qualified || c[0]) as Call;
      }
    }
  }

  return { call, property };
};