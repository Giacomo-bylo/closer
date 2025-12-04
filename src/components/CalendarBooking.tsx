import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Calendar, Clock, Check, X, Loader2, LogIn, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  generateTimeSlots,
  setAccessToken,
  getAccessToken,
  CalendarEvent,
  TimeSlot,
} from '@/services/googleCalendarService';
import { cn } from '@/lib/utils';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface CalendarBookingProps {
  leadName: string;
  leadPhone: string;
  leadAddress?: string;
  propertyId?: string;
}

const CalendarBookingInner: React.FC<CalendarBookingProps> = ({
  leadName,
  leadPhone,
  leadAddress,
  propertyId,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      setIsAuthenticated(true);
      loadEvents(selectedDate);
    },
    onError: () => {
      setError('Errore durante l\'autenticazione con Google');
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
  });

  const loadEvents = async (date: Date) => {
    if (!getAccessToken()) return;

    setLoading(true);
    setError(null);

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const fetchedEvents = await fetchCalendarEvents(startOfDay, endOfDay);
      setEvents(fetchedEvents);

      const generatedSlots = generateTimeSlots(date, fetchedEvents);
      setSlots(generatedSlots);
    } catch (err) {
      setError('Errore nel caricamento degli eventi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents(selectedDate);
    }
  }, [selectedDate, isAuthenticated]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    // Non permettere date passate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate >= today) {
      setSelectedDate(newDate);
      setSelectedSlot(null);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;

    setBooking(true);
    setError(null);

    try {
      const summary = `Appuntamento Bylo - ${leadName}`;
      const description = `Lead: ${leadName}\nTelefono: ${leadPhone}${leadAddress ? `\nIndirizzo: ${leadAddress}` : ''}${propertyId ? `\nID Proprietà: ${propertyId}` : ''}`;

      await createCalendarEvent(
        summary,
        description,
        selectedSlot.start,
        selectedSlot.end
      );

      setSuccess(true);
      setSelectedSlot(null);
      
      // Ricarica gli eventi per aggiornare la disponibilità
      await loadEvents(selectedDate);

      // Reset success dopo 3 secondi
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Errore nella prenotazione');
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-blue-50">
          <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
            <Calendar size={16} />
            Prenota Appuntamento
          </h3>
        </div>
        <div className="p-6 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-600 mb-4">
            Collega il tuo Google Calendar per vedere la disponibilità e prenotare appuntamenti.
          </p>
          <button
            onClick={() => login()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-bylo-blue text-white rounded-lg hover:bg-bylo-hover transition-colors font-medium"
          >
            <LogIn size={18} />
            Connetti Google Calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-blue-50">
        <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
          <Calendar size={16} />
          Prenota Appuntamento
        </h3>
      </div>

      <div className="p-5">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleDateChange(-1)}
            disabled={isToday(selectedDate)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="font-semibold text-slate-900 capitalize">
              {formatDate(selectedDate)}
            </div>
            {isToday(selectedDate) && (
              <span className="text-xs text-bylo-blue font-medium">Oggi</span>
            )}
          </div>
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <X size={16} />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
            <Check size={16} />
            Appuntamento prenotato con successo!
          </div>
        )}

        {/* Time Slots */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-bylo-blue" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
            {slots.map((slot, index) => (
              <button
                key={index}
                onClick={() => slot.available && setSelectedSlot(slot)}
                disabled={!slot.available}
                className={cn(
                  'p-2 rounded-lg text-sm font-medium transition-all',
                  slot.available
                    ? selectedSlot?.start.getTime() === slot.start.getTime()
                      ? 'bg-bylo-blue text-white'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                )}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        )}

        {/* Selected Slot Summary */}
        {selectedSlot && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock size={16} />
              <span>
                Slot selezionato: <strong>{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={handleBookAppointment}
          disabled={!selectedSlot || booking}
          className="w-full py-3 bg-bylo-blue text-white rounded-lg font-medium hover:bg-bylo-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {booking ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Prenotazione in corso...
            </>
          ) : (
            <>
              <Check size={18} />
              Prenota Appuntamento
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const CalendarBooking: React.FC<CalendarBookingProps> = (props) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CalendarBookingInner {...props} />
    </GoogleOAuthProvider>
  );
};

export default CalendarBooking;