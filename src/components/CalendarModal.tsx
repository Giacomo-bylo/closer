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

const CalendarModalInner: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  eventType,
  leadName,
  leadPhone,
  leadAddress,
  propertyId,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAccessToken());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthEvents, setMonthEvents] = useState<CalendarEvent[]>([]);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [booking, setBooking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

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

  const loadMonthEvents = async (): Promise<void> => {
    if (!getAccessToken()) return;

    setLoading(true);
    setError(null);

    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);

      const fetchedEvents = await fetchCalendarEvents(startOfMonth, endOfMonth);
      setMonthEvents(fetchedEvents);
    } catch (err) {
      setError('Errore nel caricamento degli eventi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDayDetails = (date: Date): void => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const eventsOfDay = monthEvents.filter((event: CalendarEvent) => {
      const eventStart = new Date(event.start);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    });
    
    setDayEvents(eventsOfDay);
    const generatedSlots = generateTimeSlots(date, monthEvents);
    setSlots(generatedSlots);
  };

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadMonthEvents();
    }
  }, [currentMonth, isAuthenticated, isOpen]);

  useEffect(() => {
    if (selectedDate) {
      loadDayDetails(selectedDate);
    }
  }, [selectedDate, monthEvents]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleMonthChange = (direction: number): void => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (newMonth >= thisMonth) {
      setCurrentMonth(newMonth);
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  };

  const handleDaySelect = (date: Date): void => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const handleBookAppointment = async (): Promise<void> => {
    if (!selectedSlot || !selectedDate) return;

    setBooking(true);
    setError(null);

    try {
      const eventTitle = eventType === 'sopralluogo' 
        ? `Sopralluogo - ${leadName}`
        : `Preliminare - ${leadName}`;
      
      const description = `${eventType === 'sopralluogo' ? 'Sopralluogo immobile' : 'Firma preliminare'}\n\nLead: ${leadName}\nTelefono: ${leadPhone}${leadAddress ? `\nIndirizzo: ${leadAddress}` : ''}${propertyId ? `\nID Proprietà: ${propertyId}` : ''}`;

      await createCalendarEvent(
        eventTitle,
        description,
        selectedSlot.start,
        selectedSlot.end
      );

      setSuccess(true);
      
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      setTimeout(() => {
        onEventCreated(formattedDate);
        onClose();
      }, 1500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella prenotazione';
      setError(errorMessage);
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  };

  const formatSelectedDate = (date: Date): string => {
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isCurrentMonth = (): boolean => {
    const today = new Date();
    return currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const getEventsCountForDay = (date: Date): number => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return monthEvents.filter((event: CalendarEvent) => {
      const eventStart = new Date(event.start);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    }).length;
  };

  // Genera griglia del mese - restituisce solo Date del mese corrente con info
  const generateMonthGrid = (): Array<{ date: Date; isCurrentMonth: boolean }> => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Calcola il giorno della settimana (0 = domenica, 1 = lunedì, ecc.)
    // Convertiamo a formato europeo (lunedì = 0)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Giorni del mese precedente come placeholder
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const placeholderDate = new Date(year, month, -i);
      days.push({ date: placeholderDate, isCurrentMonth: false });
    }
    
    // Giorni del mese corrente
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    
    return days;
  };

  const monthDays = generateMonthGrid();
  const weekDayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-bylo-blue to-blue-600 text-white flex items-center justify-between">
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

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 mb-4">
                Connetti Google Calendar per vedere la disponibilità
              </p>
              <button
                onClick={() => login()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bylo-blue text-white rounded-lg hover:bg-bylo-hover transition-colors font-medium"
              >
                <LogIn size={18} />
                Connetti Google Calendar
              </button>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <X size={16} />
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
                  <Check size={16} />
                  Appuntamento prenotato con successo!
                </div>
              )}

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => handleMonthChange(-1)}
                  disabled={isCurrentMonth()}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="font-semibold text-slate-900 capitalize">
                  {formatMonthYear(currentMonth)}
                </div>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-bylo-blue" />
                </div>
              ) : !selectedDate ? (
                <>
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDayNames.map((name, i) => (
                      <div key={i} className="text-center text-xs font-medium text-slate-500 py-1">
                        {name}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((dayInfo, index) => {
                      // Se non è del mese corrente, mostra cella vuota
                      if (!dayInfo.isCurrentMonth) {
                        return <div key={index} className="aspect-square" />;
                      }

                      const dayDate: Date = dayInfo.date;
                      const eventsCount = getEventsCountForDay(dayDate);
                      const past = isPast(dayDate);
                      const todayCheck = isToday(dayDate);
                      
                      // Check se questo giorno è selezionato
                      let isSelected = false;
                      if (selectedDate !== null) {
                        isSelected = selectedDate.toDateString() === dayDate.toDateString();
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => handleDaySelect(dayDate)}
                          disabled={past}
                          className={cn(
                            'aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-sm relative',
                            past && 'opacity-30 cursor-not-allowed text-slate-400',
                            !past && !isSelected && 'hover:bg-slate-100 cursor-pointer',
                            isSelected && 'bg-bylo-blue text-white',
                            todayCheck && !isSelected && 'ring-2 ring-bylo-blue font-bold'
                          )}
                        >
                          <span>{dayDate.getDate()}</span>
                          {eventsCount > 0 && (
                            <span className={cn(
                              'absolute bottom-1 w-1.5 h-1.5 rounded-full',
                              isSelected ? 'bg-white' : 'bg-amber-500'
                            )} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-center text-sm text-slate-500">
                    Seleziona un giorno per vedere gli slot disponibili
                  </div>
                </>
              ) : (
                /* Day Detail View */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800 capitalize">
                      {formatSelectedDate(selectedDate)}
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedDate(null);
                        setSelectedSlot(null);
                      }}
                      className="text-sm text-bylo-blue hover:underline"
                    >
                      ← Torna al mese
                    </button>
                  </div>

                  {/* Existing Events */}
                  {dayEvents.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                        <Clock size={12} />
                        Impegni esistenti ({dayEvents.length})
                      </div>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
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

                  {/* Time Slots */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-slate-500 mb-2">
                      Slot disponibili
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
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
                          Slot: <strong>{formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot || booking || success}
                    className="w-full py-3 bg-bylo-blue text-white rounded-lg font-medium hover:bg-bylo-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {booking ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Prenotazione in corso...
                      </>
                    ) : success ? (
                      <>
                        <Check size={18} />
                        Prenotato!
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Conferma {eventType === 'sopralluogo' ? 'Sopralluogo' : 'Preliminare'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarModal: React.FC<CalendarModalProps> = (props) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CalendarModalInner {...props} />
    </GoogleOAuthProvider>
  );
};

export default CalendarModal;