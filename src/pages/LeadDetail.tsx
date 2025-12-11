import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Phone, MapPin, Building2, Clock, AlertTriangle, FileText, TrendingUp, StickyNote, Loader2, Calendar, Send, FileSignature, Home, Mail, ExternalLink } from 'lucide-react';
import { getLeadDetails } from '@/services/leadService';
import { supabaseConto } from '@/lib/supabase';
import { LeadFullProfile } from '@/types';
import Badge from '@/components/Badge';
import TranscriptViewer from '@/components/TranscriptViewer';
import CalendarModal from '@/components/CalendarModal';
import { formatDate, formatCurrency, formatDuration } from '@/lib/utils';

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LeadFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  
  const [closerStatus, setCloserStatus] = useState<string>('in_lavorazione');
  const [savingCloserStatus, setSavingCloserStatus] = useState(false);
  
  const [stepChiamata, setStepChiamata] = useState<string>('da_contattare');
  const [stepChiamataData, setStepChiamataData] = useState<string>('');
  const [stepSopralluogo, setStepSopralluogo] = useState<string>('da_organizzare');
  const [stepSopralluogoData, setStepSopralluogoData] = useState<string>('');
  const [stepAccordo, setStepAccordo] = useState<string>('da_inviare');
  const [stepAccordoData, setStepAccordoData] = useState<string>('');
  const [stepPreliminare, setStepPreliminare] = useState<string>('da_organizzare');
  const [stepPreliminareData, setStepPreliminareData] = useState<string>('');
  const [savingSteps, setSavingSteps] = useState(false);

  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalType, setCalendarModalType] = useState<'sopralluogo' | 'preliminare'>('sopralluogo');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const details = await getLeadDetails(id);
        setData(details);
        
        if (details.property) {
          if (details.property.closer_notes) setNotes(details.property.closer_notes);
          if (details.property.closer_status) setCloserStatus(details.property.closer_status);
          if (details.property.step_chiamata) setStepChiamata(details.property.step_chiamata);
          if (details.property.step_chiamata_data) setStepChiamataData(details.property.step_chiamata_data);
          if (details.property.step_sopralluogo) setStepSopralluogo(details.property.step_sopralluogo);
          if (details.property.step_sopralluogo_data) setStepSopralluogoData(details.property.step_sopralluogo_data);
          if (details.property.step_accordo) setStepAccordo(details.property.step_accordo);
          if (details.property.step_accordo_data) setStepAccordoData(details.property.step_accordo_data);
          if (details.property.step_preliminare) setStepPreliminare(details.property.step_preliminare);
          if (details.property.step_preliminare_data) setStepPreliminareData(details.property.step_preliminare_data);
        }
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

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const saveNotes = async () => {
    if (!data?.property?.id) return;
    
    setSavingNotes(true);
    setNotesSaved(false);
    
    try {
      const { error } = await supabaseConto
        .from('properties')
        .update({ closer_notes: notes })
        .eq('id', data.property.id);
      
      if (error) throw error;
      
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err) {
      console.error('Errore salvataggio note:', err);
      alert('Errore nel salvataggio delle note');
    } finally {
      setSavingNotes(false);
    }
  };

  const saveCloserStatus = async (newStatus: string) => {
    if (!data?.property?.id) return;
    
    setSavingCloserStatus(true);
    setCloserStatus(newStatus);
    
    try {
      const { error } = await supabaseConto
        .from('properties')
        .update({ closer_status: newStatus })
        .eq('id', data.property.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Errore salvataggio stato closer:', err);
      alert('Errore nel salvataggio dello stato');
    } finally {
      setSavingCloserStatus(false);
    }
  };

  const saveStep = async (field: string, value: string) => {
    if (!data?.property?.id) return;
    
    setSavingSteps(true);
    
    try {
      const { error } = await supabaseConto
        .from('properties')
        .update({ [field]: value })
        .eq('id', data.property.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Errore salvataggio step:', err);
      alert('Errore nel salvataggio');
    } finally {
      setSavingSteps(false);
    }
  };

  const openCalendarModal = (type: 'sopralluogo' | 'preliminare') => {
    setCalendarModalType(type);
    setCalendarModalOpen(true);
  };

  const handleEventCreated = (date: string) => {
    if (calendarModalType === 'sopralluogo') {
      setStepSopralluogoData(date);
      setStepSopralluogo('organizzato');
      saveStep('step_sopralluogo_data', date);
      saveStep('step_sopralluogo', 'organizzato');
    } else {
      setStepPreliminareData(date);
      setStepPreliminare('organizzato');
      saveStep('step_preliminare_data', date);
      saveStep('step_preliminare', 'organizzato');
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDateChange = (field: string, setDateFn: (val: string) => void, value: string) => {
    setDateFn(value);
    saveStep(field, value);
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
  const leadEmail = property?.lead_email || null;

  const prezzoAcquistoMin = property?.prezzo_acquisto ? Math.round(property.prezzo_acquisto * 0.95) : null;
  const prezzoAcquistoMax = property?.prezzo_acquisto || null;

  const StepWithDatePicker = ({ 
    label, 
    icon: Icon, 
    status, 
    setStatus, 
    field,
    completedLabel,
    pendingLabel,
    dateValue,
    setDateValue,
    dateField,
    pendingText,
    completedText,
  }: { 
    label: string;
    icon: React.ElementType;
    status: string;
    setStatus: (val: string) => void;
    field: string;
    completedLabel: string;
    pendingLabel: string;
    dateValue: string;
    setDateValue: (val: string) => void;
    dateField: string;
    pendingText: string;
    completedText: string;
  }) => {
    const isCompleted = status === completedLabel;
    
    return (
      <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2 w-28 flex-shrink-0">
          <Icon size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        
        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button
            onClick={() => {
              setStatus(pendingLabel);
              saveStep(field, pendingLabel);
            }}
            className={`w-28 py-2 text-xs font-medium transition-colors ${
              !isCompleted 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {pendingText}
          </button>
          <button
            onClick={() => {
              setStatus(completedLabel);
              saveStep(field, completedLabel);
            }}
            className={`w-28 py-2 text-xs font-medium transition-colors ${
              isCompleted 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {completedText}
          </button>
        </div>

        <div className="flex-1">
          <input
            type="date"
            value={dateValue}
            onChange={(e) => handleDateChange(dateField, setDateValue, e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bylo-blue focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const StepWithCalendly = ({ 
    label, 
    icon: Icon, 
    status, 
    setStatus, 
    field,
    completedLabel,
    pendingLabel,
    calendarType,
    dateValue,
  }: { 
    label: string;
    icon: React.ElementType;
    status: string;
    setStatus: (val: string) => void;
    field: string;
    completedLabel: string;
    pendingLabel: string;
    calendarType: 'sopralluogo' | 'preliminare';
    dateValue?: string;
  }) => {
    const isCompleted = status === completedLabel;
    const hasBooking = Boolean(dateValue);
    
    const renderActionButton = () => {
      if (hasBooking) {
        return (
          <a
            href="https://calendly.com/app/scheduled_events/user/me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-500 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <ExternalLink size={14} />
            Modifica
          </a>
        );
      }
      return (
        <button
          onClick={() => openCalendarModal(calendarType)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-bylo-blue hover:bg-bylo-hover rounded-lg transition-colors"
        >
          <Calendar size={14} />
          Prenota
        </button>
      );
    };
    
    return (
      <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2 w-28 flex-shrink-0">
          <Icon size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        
        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button
            onClick={() => {
              setStatus(pendingLabel);
              saveStep(field, pendingLabel);
            }}
            className={`w-28 py-2 text-xs font-medium transition-colors ${
              !isCompleted 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            Da organizzare
          </button>
          <button
            onClick={() => {
              setStatus(completedLabel);
              saveStep(field, completedLabel);
            }}
            className={`w-28 py-2 text-xs font-medium transition-colors ${
              isCompleted 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            Organizzato
          </button>
        </div>

        <div className="flex-1 flex items-center gap-2">
          {renderActionButton()}
          {dateValue && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
              {formatDateDisplay(dateValue)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderSaveNotesButton = () => {
    if (savingNotes) {
      return (
        <span className="flex items-center gap-1.5">
          <Loader2 size={12} className="animate-spin" />
          Salvo...
        </span>
      );
    }
    return 'Salva Note';
  };

  return (
    <div className="space-y-6">
      {property && (
        <CalendarModal
          isOpen={calendarModalOpen}
          onClose={() => setCalendarModalOpen(false)}
          onEventCreated={handleEventCreated}
          eventType={calendarModalType}
          leadName={leadName}
          leadPhone={leadPhone}
          leadAddress={property.indirizzo_completo}
          propertyId={property.id}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{leadName}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Phone size={14} />
                <span>{leadPhone}</span>
              </div>
              {leadEmail && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Mail size={14} />
                  <span>{leadEmail}</span>
                  <button
                    onClick={() => copyEmail(leadEmail)}
                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                    title="Copia email"
                  >
                    {copiedEmail ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} className="text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {property && (
            <select
              value={closerStatus}
              onChange={(e) => saveCloserStatus(e.target.value)}
              disabled={savingCloserStatus}
              className={`px-5 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none text-center ${
                closerStatus === 'approvato' 
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 focus:ring-emerald-400' 
                  : closerStatus === 'rifiutato'
                  ? 'bg-red-50 border-red-400 text-red-700 focus:ring-red-400'
                  : 'bg-amber-50 border-amber-400 text-amber-700 focus:ring-amber-400'
              }`}
              style={{ minWidth: '160px', textAlignLast: 'center' }}
            >
              <option value="in_lavorazione">In lavorazione</option>
              <option value="approvato">Approvato</option>
              <option value="rifiutato">Rifiutato</option>
            </select>
          )}
          
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? 'Copiato!' : 'Copia link'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <section className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Phone size={16} className="text-bylo-blue" />
                <h2>Conversazione Setter</h2>
              </div>
              {call && (
                <span className="text-xs text-slate-500">{formatDate(call.created_at)}</span>
              )}
            </div>

            <div className="p-5">
              {!call ? (
                <div className="text-center py-6 text-slate-400">
                  <Phone size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nessuna chiamata registrata</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">Esito</div>
                      <Badge status={call.esito_qualificazione} type="qualification" />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">Durata</div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <Clock size={12} />
                        {formatDuration(call.durata_chiamata)}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">Urgenza</div>
                      <Badge status={call.urgenza_cliente || 'sconosciuta'} type="urgency" />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-1">Sentiment</div>
                      <Badge status={call.sentiment_cliente || 'neutro'} type="sentiment" />
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                    <h3 className="text-xs font-semibold text-blue-900 mb-1.5 flex items-center gap-1.5">
                      <FileText size={14} /> Riepilogo
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {call.riepilogo_chiamata || "Nessun riepilogo disponibile."}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    {call.problematiche_immobile && (
                      <div>
                        <span className="font-medium text-slate-900">Problematiche:</span>
                        <p className="text-slate-600 mt-0.5">{call.problematiche_immobile}</p>
                      </div>
                    )}
                    {call.obiezioni_cliente && (
                      <div>
                        <span className="font-medium text-slate-900">Obiezioni:</span>
                        <p className="text-slate-600 mt-0.5">{call.obiezioni_cliente}</p>
                      </div>
                    )}
                    {call.esito_qualificazione === 'callback_richiesto' && (
                      <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                        <Clock className="flex-shrink-0 mt-0.5" size={14} />
                        <div>
                          <span className="font-bold">Callback:</span> {call.callback_orario || 'Orario non specificato'}
                          {call.callback_motivo && <div className="mt-0.5 text-xs opacity-90">{call.callback_motivo}</div>}
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

        <section className="space-y-4">
          
          {property && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-bylo-blue/5 to-transparent">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <FileSignature size={16} className="text-bylo-blue" />
                  <h2>Processo Acquisizione</h2>
                </div>
              </div>
              <div className="px-5 py-2">
                <StepWithDatePicker
                  label="Chiamata"
                  icon={Phone}
                  status={stepChiamata}
                  setStatus={setStepChiamata}
                  field="step_chiamata"
                  pendingLabel="da_contattare"
                  completedLabel="contattato"
                  dateValue={stepChiamataData}
                  setDateValue={setStepChiamataData}
                  dateField="step_chiamata_data"
                  pendingText="Da contattare"
                  completedText="Contattato"
                />
                <StepWithCalendly
                  label="Sopralluogo"
                  icon={Home}
                  status={stepSopralluogo}
                  setStatus={setStepSopralluogo}
                  field="step_sopralluogo"
                  pendingLabel="da_organizzare"
                  completedLabel="organizzato"
                  calendarType="sopralluogo"
                  dateValue={stepSopralluogoData}
                />
                <StepWithDatePicker
                  label="Accordo"
                  icon={Send}
                  status={stepAccordo}
                  setStatus={setStepAccordo}
                  field="step_accordo"
                  pendingLabel="da_inviare"
                  completedLabel="inviato"
                  dateValue={stepAccordoData}
                  setDateValue={setStepAccordoData}
                  dateField="step_accordo_data"
                  pendingText="Da inviare"
                  completedText="Inviato"
                />
                <StepWithCalendly
                  label="Preliminare"
                  icon={FileSignature}
                  status={stepPreliminare}
                  setStatus={setStepPreliminare}
                  field="step_preliminare"
                  pendingLabel="da_organizzare"
                  completedLabel="organizzato"
                  calendarType="preliminare"
                  dateValue={stepPreliminareData}
                />
              </div>
            </div>
          )}

          {!property && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="text-center py-6 text-slate-400">
                <Building2 size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Valutazione immobile non disponibile</p>
              </div>
            </div>
          )}

          {property && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Building2 size={16} className="text-bylo-blue" />
                  <h2>Scheda Immobile</h2>
                </div>
                <Badge status={property.status} type="property" />
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="mt-0.5 bg-slate-100 p-2 rounded-lg text-slate-500">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{property.indirizzo_completo}</h4>
                    <p className="text-sm text-slate-500">
                      {property.tipo_immobile || 'Immobile'} • {property.superficie_mq} mq • {property.numero_locali} locali
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipologia</span>
                    <span className="font-medium">{property.tipo_immobile || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Condizioni</span>
                    <span className="font-medium">{property.condizioni_immobile || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Superficie</span>
                    <span className="font-medium">{property.superficie_mq ? `${property.superficie_mq} mq` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Locali</span>
                    <span className="font-medium">{property.numero_locali || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bagni</span>
                    <span className="font-medium">{property.numero_bagni || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Piano</span>
                    <span className="font-medium">{property.piano_immobile || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ascensore</span>
                    <span className="font-medium">{property.ascensore || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anno costruzione</span>
                    <span className="font-medium">{property.anno_costruzione || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aree esterne</span>
                    <span className="font-medium">{property.aree_esterne || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pertinenze</span>
                    <span className="font-medium">{property.pertinenze || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {property && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-emerald-50">
                <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  <TrendingUp size={14} />
                  Valutazione Economica
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="bg-bylo-blue/5 border border-bylo-blue/20 rounded-lg p-3">
                    <div className="text-[10px] text-bylo-blue font-medium uppercase tracking-wide mb-0.5">Range Offerta</div>
                    <div className="text-xl font-bold text-bylo-blue">
                      {prezzoAcquistoMin && prezzoAcquistoMax 
                        ? `${formatCurrency(prezzoAcquistoMin)} - ${formatCurrency(prezzoAcquistoMax)}`
                        : '-'
                      }
                    </div>
                  </div>

                  <div className={`rounded-lg p-3 ${property.offerta_definitiva ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className={`text-[10px] font-medium uppercase tracking-wide mb-0.5 ${property.offerta_definitiva ? 'text-emerald-600' : 'text-slate-500'}`}>
                      Offerta Definitiva
                    </div>
                    <div className={`text-xl font-bold ${property.offerta_definitiva ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {property.offerta_definitiva ? formatCurrency(property.offerta_definitiva) : 'Da definire'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-500 mb-0.5">Prezzo Rivendita</div>
                      <div className="text-base font-semibold text-slate-900">{formatCurrency(property.prezzo_rivendita)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-500 mb-0.5">Costi Riqualificazione</div>
                      <div className="text-base font-semibold text-slate-900">{formatCurrency(property.totale_costi_escluso_acquisto)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {property && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-amber-50">
                <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <StickyNote size={14} />
                  Note Closer
                </h3>
              </div>
              <div className="p-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Aggiungi note su questo lead..."
                  className="w-full h-24 p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-bylo-blue focus:border-transparent placeholder-slate-400"
                />
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {notesSaved && (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check size={12} /> Salvate!
                      </span>
                    )}
                  </span>
                  <button 
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-bylo-blue hover:bg-bylo-hover rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {renderSaveNotesButton()}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default LeadDetail;