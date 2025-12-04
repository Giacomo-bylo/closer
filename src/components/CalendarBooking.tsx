import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Calendar, Clock, Check, X, Loader2, LogIn, ChevronLeft, ChevronRight, User } from 'lucide-react';
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
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
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
    },
    onError: () => {
      setError('Errore durante l\'autenticazione con Google');
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
  });

  // Carica eventi della settimana
  const loadWeekEvents = async () => {
    if (!getAccessToken()) return;

    setLoading(true);
    setError(null);

    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      const fetchedEvents = await fetchCalendarEvents(currentWeekStart, weekEnd);
      setWeekEvents(fetchedEvents);
    } catch (err) {
      setError('Errore nel caricamento degli eventi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Carica eventi e slot del giorno selezionato
  const loadDayDetails = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Filtra eventi del giorno
    const eventsOfDay = weekEvents.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    });
    
    setDayEvents(eventsOfDay);

    // Genera slot
    const generatedSlots = generateTimeSlots(date, weekEvents);
    setSlots(generatedSlots);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWeekEvents();
    }
  }, [currentWeekStart, isAuthenticated]);

  useEffect(() => {
    if (selectedDate && weekEvents.length >= 0) {
      loadDayDetails(selectedDate);
    }
  }, [selectedDate, weekEvents]);

  const handleWeekChange = (direction: number) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    
    // Non permettere settimane passate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonday = new Date(today);
    const day = thisMonday.getDay();
    const diff = thisMonday.getDate() - day + (day === 0 ? -6 : 1);
    thisMonday.setDate(diff);
    
    if (newWeekStart >= thisMonday) {
      setCurrentWeekStart(newWeekStart);
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  };

  const handleDaySelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) {
      setSelectedDate(date);
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
      
      // Ricarica gli eventi
      await loadWeekEvents();
      if (selectedDate) {
        loadDayDetails(selectedDate);
      }

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

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
  };

  const formatDayNumber = (date: Date) => {
    return date.getDate();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getEventsCountForDay = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return weekEvents.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    }).length;
  };

  // Genera array dei 7 giorni della settimana
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(currentWeekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const isCurrentWeek = () => {
    const today = new Date();
    const thisMonday = new Date(today);
    const day = thisMonday.getDay();
    const diff = thisMonday.getDate() - day + (day === 0 ? -6 : 1);
    thisMonday.setDate(diff);
    thisMonday.setHours(0, 0, 0, 0);
    
    return currentWeekStart.getTime() === thisMonday.getTime();
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

      <div className="p-4">
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

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => handleWeekChange(-1)}
            disabled={isCurrentWeek()}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="font-semibold text-slate-900 capitalize text-sm">
              {formatMonthYear(currentWeekStart)}
            </div>
          </div>
          <button
            onClick={() => handleWeekChange(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Week Days Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-bylo-blue" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDays.map((day, index) => {
              const eventsCount = getEventsCountForDay(day);
              const past = isPast(day);
              const today = isToday(day);
              const selected = selectedDate?.toDateString() === day.toDateString();

              return (
                <button
                  key={index}
                  onClick={() => handleDaySelect(day)}
                  disabled={past}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg transition-all text-center',
                    past && 'opacity-40 cursor-not-allowed',
                    !past && !selected && 'hover:bg-slate-100 cursor-pointer',
                    selected && 'bg-bylo-blue text-white',
                    today && !selected && 'ring-2 ring-bylo-blue ring-inset'
                  )}
                >
                  <span className={cn(
                    'text-[10px] font-medium',
                    selected ? 'text-blue-100' : 'text-slate-500'
                  )}>
                    {formatDayName(day)}
                  </span>
                  <span className={cn(
                    'text-lg font-bold',
                    selected ? 'text-white' : 'text-slate-900'
                  )}>
                    {formatDayNumber(day)}
                  </span>
                  {eventsCount > 0 && (
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full font-medium mt-0.5',
                      selected ? 'bg-blue-400 text-white' : 'bg-amber-100 text-amber-700'
                    )}>
                      {eventsCount} ev.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Day Details */}
        {selectedDate && (
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-800 capitalize text-sm">
                {formatSelectedDate(selectedDate)}
              </h4>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ← Torna alla settimana
              </button>
            </div>

            {/* Impegni del giorno */}
            {dayEvents.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <Clock size={12} />
                  Impegni esistenti ({dayEvents.length})
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {dayEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-red-900 truncate">{event.summary}</div>
                        <div className="text-red-600">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slot disponibili */}
            <div className="mb-4">
              <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                <Check size={12} />
                Slot disponibili
              </div>
              <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                {slots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => slot.available && setSelectedSlot(slot)}
                    disabled={!slot.available}
                    className={cn(
                      'p-2 rounded-lg text-xs font-medium transition-all',
                      slot.available
                        ? selectedSlot?.start.getTime() === slot.start.getTime()
                          ? 'bg-bylo-blue text-white'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                    )}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Slot Summary */}
            {selectedSlot && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Clock size={14} />
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
              className="w-full py-2.5 bg-bylo-blue text-white rounded-lg font-medium hover:bg-bylo-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {booking ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Prenotazione in corso...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Prenota Appuntamento
                </>
              )}
            </button>
          </div>
        )}

        {/* Hint when no day selected */}
        {!selectedDate && !loading && (
          <div className="text-center py-4 text-slate-400 text-sm">
            Seleziona un giorno per vedere gli slot disponibili
          </div>
        )}
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