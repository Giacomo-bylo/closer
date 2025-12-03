import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Phone, MapPin, Building2, Clock, AlertTriangle, FileText, TrendingUp, StickyNote } from 'lucide-react';
import { getLeadDetails } from '@/services/leadService';
import { LeadFullProfile } from '@/types';
import Badge from '@/components/Badge';
import TranscriptViewer from '@/components/TranscriptViewer';
import { formatDate, formatCurrency, formatDuration } from '@/lib/utils';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LeadFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const details = await getLeadDetails(id);
        setData(details);
      } catch (err) {
        setError('Impossibile caricare i dettagli del lead. Verifica l\'ID o riprova.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bylo-blue"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Errore</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/" className="text-bylo-blue hover:underline font-medium">Torna alla ricerca</Link>
      </div>
    );
  }

  const { call, property } = data;
  const leadName = property?.lead_nome 
    ? `${property.lead_nome} ${property.lead_cognome || ''}` 
    : call?.lead_nome || 'Nome Sconosciuto';
  
  const leadPhone = property?.lead_telefono || call?.lead_telefono || 'Numero non disponibile';

  // Calcola range offerta
  const prezzoAcquistoMin = property?.prezzo_acquisto ? Math.round(property.prezzo_acquisto * 0.95) : null;
  const prezzoAcquistoMax = property?.prezzo_acquisto || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{leadName}</h1>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Phone size={14} />
              <span>{leadPhone}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-fit"
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          {copied ? 'Link copiato!' : 'Copia link scheda'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Call */}
        <section className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Phone size={18} className="text-bylo-blue" />
                <h2>Conversazione Setter</h2>
              </div>
              {call && (
                <span className="text-xs text-slate-500">{formatDate(call.created_at)}</span>
              )}
            </div>

            <div className="p-6">
              {!call ? (
                <div className="text-center py-8 text-slate-400">
                  <Phone size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Nessuna chiamata registrata per questo numero.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Esito</div>
                      <Badge status={call.esito_qualificazione} type="qualification" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Durata</div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Clock size={14} />
                        {formatDuration(call.durata_chiamata)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Urgenza</div>
                      <Badge status={call.urgenza_cliente || 'sconosciuta'} type="urgency" />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Sentiment</div>
                      <Badge status={call.sentiment_cliente || 'neutro'} type="sentiment" />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <FileText size={16} /> Riepilogo Chiamata
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {call.riepilogo_chiamata || "Nessun riepilogo disponibile."}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {call.problematiche_immobile && (
                      <div>
                        <span className="text-sm font-medium text-slate-900">Problematiche:</span>
                        <p className="text-sm text-slate-600 mt-1">{call.problematiche_immobile}</p>
                      </div>
                    )}
                    {call.obiezioni_cliente && (
                      <div>
                        <span className="text-sm font-medium text-slate-900">Obiezioni:</span>
                        <p className="text-sm text-slate-600 mt-1">{call.obiezioni_cliente}</p>
                      </div>
                    )}
                    {call.esito_qualificazione === 'callback_richiesto' && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                        <Clock className="flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <span className="font-bold">Callback Richiesto:</span> {call.callback_orario || 'Orario non specificato'}
                          {call.callback_motivo && <div className="mt-1 text-xs opacity-90">{call.callback_motivo}</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  <TranscriptViewer transcript={call.transcript} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Property */}
        <section className="space-y-4">
          {/* Header Scheda Immobile */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Building2 size={18} className="text-bylo-blue" />
                <h2>Scheda Immobile</h2>
              </div>
              {property && <Badge status={property.status} type="property" />}
            </div>
          </div>

          {!property ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="text-center py-8 text-slate-400">
                <Building2 size={48} className="mx-auto mb-3 opacity-20" />
                <p>Valutazione immobile non ancora disponibile.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Riquadro 1: Dettagli Immobile */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-700">Dettagli Immobile</h3>
                </div>
                <div className="p-5">
                  {/* Address */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="mt-0.5 bg-slate-100 p-2 rounded-lg text-slate-500">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{property.indirizzo_completo}</h4>
                      <p className="text-sm text-slate-500">
                        {property.tipo_immobile || 'Immobile'} • {property.superficie_mq} mq • {property.numero_locali} locali
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Piano</span>
                      <span className="font-medium">{property.piano_immobile || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ascensore</span>
                      <span className="font-medium">{property.ascensore || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Anno</span>
                      <span className="font-medium">{property.anno_costruzione || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bagni</span>
                      <span className="font-medium">{property.numero_bagni || '-'}</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-slate-500">Condizioni</span>
                      <span className="font-medium">{property.condizioni_immobile || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riquadro 2: Valutazione Economica */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-emerald-50">
                  <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Valutazione Economica
                  </h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {/* Range Offerta - In evidenza */}
                    <div className="bg-bylo-blue/5 border border-bylo-blue/20 rounded-lg p-4">
                      <div className="text-xs text-bylo-blue font-medium uppercase tracking-wide mb-1">Range Offerta</div>
                      <div className="text-2xl font-bold text-bylo-blue">
                        {prezzoAcquistoMin && prezzoAcquistoMax 
                          ? `${formatCurrency(prezzoAcquistoMin)} - ${formatCurrency(prezzoAcquistoMax)}`
                          : '-'
                        }
                      </div>
                    </div>

                    {/* Altri dati economici */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Prezzo Rivendita</div>
                        <div className="text-lg font-semibold text-slate-900">{formatCurrency(property.prezzo_rivendita)}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Costi Totali</div>
                        <div className="text-lg font-semibold text-slate-900">{formatCurrency(property.totale_costi)}</div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <div className="text-xs text-emerald-600 mb-1">ROI Stimato</div>
                        <div className="text-lg font-semibold text-emerald-700">{property.roi ? `${property.roi}%` : '-'}</div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <div className="text-xs text-emerald-600 mb-1">Utile Lordo</div>
                        <div className="text-lg font-semibold text-emerald-700">{formatCurrency(property.utile_lordo)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riquadro 3: Note Closer */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-amber-50">
                  <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <StickyNote size={16} />
                    Note Closer
                  </h3>
                </div>
                <div className="p-5">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Aggiungi note su questo lead... (es. esito chiamata, accordi presi, prossimi passi)"
                    className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-bylo-blue focus:border-transparent placeholder-slate-400"
                  />
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Le note verranno salvate automaticamente</span>
                    <button 
                      className="px-4 py-2 text-sm font-medium text-white bg-bylo-blue hover:bg-bylo-hover rounded-lg transition-colors disabled:opacity-50"
                      disabled={!notes.trim()}
                    >
                      Salva Note
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
};

export default LeadDetail;