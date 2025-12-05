import React, { useEffect, useState } from 'react';
import { Calendar, X, Check, Loader2 } from 'lucide-react';

// URLs Calendly
const CALENDLY_URLS = {
  sopralluogo: 'https://calendly.com/bylo/sopralluogo',
  preliminare: 'https://calendly.com/bylo/preliminare',
};

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (date: string) => void;
  eventType: 'sopralluogo' | 'preliminare';
  leadName: string;
  leadPhone: string;
  leadAddress?: string;
  propertyId?: string;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  eventType,
  leadName,
  leadPhone,
  leadAddress,
}) => {
  const [loading, setLoading] = useState(true);
  const [eventScheduled, setEventScheduled] = useState(false);

  // Costruisce l'URL con prefill dei dati
  const buildCalendlyUrl = (): string => {
    const baseUrl = CALENDLY_URLS[eventType];
    const params = new URLSearchParams();
    
    // Prefill nome e telefono
    if (leadName) {
      const nameParts = leadName.trim().split(' ');
      params.append('name', leadName);
      if (nameParts.length > 1) {
        params.append('first_name', nameParts[0]);
        params.append('last_name', nameParts.slice(1).join(' '));
      }
    }
    
    // Aggiungi location se disponibile
    if (leadAddress) {
      params.append('location', leadAddress);
    }
    
    // Custom questions (se configurate in Calendly)
    if (leadPhone) {
      params.append('a1', leadPhone); // Primo campo custom
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Listener per eventi Calendly
  useEffect(() => {
    if (!isOpen) return;

    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.data.event === 'calendly.event_scheduled') {
        setEventScheduled(true);
        
        // Estrai la data dall'evento se disponibile
        const eventData = e.data.payload;
        let scheduledDate = new Date().toISOString().split('T')[0];
        
        if (eventData?.event?.start_time) {
          scheduledDate = new Date(eventData.event.start_time).toISOString().split('T')[0];
        }
        
        // Notifica dopo un breve delay per mostrare il successo
        setTimeout(() => {
          onEventCreated(scheduledDate);
          onClose();
        }, 1500);
      }
    };

    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, [isOpen, onEventCreated, onClose]);

  // Reset stato quando si chiude
  useEffect(() => {
    if (!isOpen) {
      setLoading(true);
      setEventScheduled(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - dimensione fissa */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 h-[700px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-bylo-blue to-blue-600 text-white flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar size={18} />
            {eventType === 'sopralluogo' ? 'Prenota Sopralluogo' : 'Prenota Preliminare'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - altezza fissa */}
        <div className="flex-1 relative min-h-0">
          {/* Success overlay */}
          {eventScheduled && (
            <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check size={32} className="text-emerald-600" />
              </div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">Appuntamento Prenotato!</h4>
              <p className="text-slate-500">Chiusura automatica...</p>
            </div>
          )}

          {/* Loading indicator */}
          {loading && !eventScheduled && (
            <div className="absolute inset-0 bg-white z-5 flex items-center justify-center">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-bylo-blue mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Caricamento calendario...</p>
              </div>
            </div>
          )}

          {/* Calendly iframe */}
          <iframe
            src={buildCalendlyUrl()}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Calendly Scheduling"
            onLoad={() => setLoading(false)}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;