import React, { useEffect, useState, useRef } from 'react';
import { Calendar, X, Check, Loader2 } from 'lucide-react';

// URLs Calendly
const CALENDLY_URLS = {
  sopralluogo: 'https://calendly.com/bylo/sopralluogo',
  preliminare: 'https://calendly.com/bylo/preliminare',
};

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (date: string, time: string) => void;
  eventType: 'sopralluogo' | 'preliminare';
  leadName: string;
  leadPhone: string;
  leadAddress?: string;
  propertyId?: string;
}

// Dichiarazione per TypeScript
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: {
          name?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          customAnswers?: Record<string, string>;
        };
        utm?: Record<string, string>;
      }) => void;
    };
  }
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  eventType,
  leadName,
}) => {
  const [loading, setLoading] = useState(true);
  const [eventScheduled, setEventScheduled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Carica lo script di Calendly
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    // Carica il CSS di Calendly
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Carica lo script di Calendly
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
    };
    document.head.appendChild(script);

    return () => {
      // Non rimuoviamo script e CSS per evitare problemi di ricaricamento
    };
  }, []);

  // Inizializza il widget quando il modal si apre
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Aspetta che lo script sia caricato
    const initWidget = () => {
      if (!window.Calendly || !containerRef.current) {
        setTimeout(initWidget, 100);
        return;
      }

      // Pulisci il container
      containerRef.current.innerHTML = '';

      // Costruisci l'URL con il parametro per nascondere il banner GDPR
      const baseUrl = CALENDLY_URLS[eventType];
      const url = `${baseUrl}?hide_gdpr_banner=1&hide_event_type_details=0`;

      // Prepara i dati di prefill
      const prefill: {
        name?: string;
        firstName?: string;
        lastName?: string;
        customAnswers?: Record<string, string>;
      } = {};

      if (leadName) {
        const nameParts = leadName.trim().split(' ');
        prefill.name = leadName;
        if (nameParts.length > 0) {
          prefill.firstName = nameParts[0];
        }
        if (nameParts.length > 1) {
          prefill.lastName = nameParts.slice(1).join(' ');
        }
      }

      // Inizializza il widget
      window.Calendly.initInlineWidget({
        url: url,
        parentElement: containerRef.current,
        prefill: prefill,
      });

      setLoading(false);
    };

    setLoading(true);
    initWidget();
  }, [isOpen, eventType, leadName]);

  // Listener per eventi Calendly
  useEffect(() => {
    if (!isOpen) return;

    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.data.event === 'calendly.event_scheduled') {
        setEventScheduled(true);
        
        // Estrai data e orario dall'evento
        const eventData = e.data.payload;
        let scheduledDate = new Date().toISOString().split('T')[0];
        let scheduledTime = '';
        
        if (eventData?.event?.start_time) {
          const startTime = new Date(eventData.event.start_time);
          scheduledDate = startTime.toISOString().split('T')[0];
          // Formatta l'orario in formato HH:MM
          scheduledTime = startTime.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
        
        // Notifica dopo un breve delay per mostrare il successo
        setTimeout(() => {
          onEventCreated(scheduledDate, scheduledTime);
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
        <div className="flex-1 relative min-h-0 overflow-hidden">
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

          {/* Calendly widget container */}
          <div 
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: '600px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;