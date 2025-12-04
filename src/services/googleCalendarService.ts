const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const fetchCalendarEvents = async (
  timeMin: Date,
  timeMax: Date,
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> => {
  if (!accessToken) {
    throw new Error('Non autenticato con Google');
  }

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Errore nel recupero degli eventi');
  }

  const data = await response.json();

  return (data.items || []).map((event: any) => ({
    id: event.id,
    summary: event.summary || 'Occupato',
    start: new Date(event.start.dateTime || event.start.date),
    end: new Date(event.end.dateTime || event.end.date),
    description: event.description,
  }));
};

export const createCalendarEvent = async (
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  calendarId: string = 'primary'
): Promise<CalendarEvent> => {
  if (!accessToken) {
    throw new Error('Non autenticato con Google');
  }

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Europe/Rome',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Europe/Rome',
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Errore nella creazione dell\'evento');
  }

  const data = await response.json();

  return {
    id: data.id,
    summary: data.summary,
    start: new Date(data.start.dateTime),
    end: new Date(data.end.dateTime),
    description: data.description,
  };
};

export const generateTimeSlots = (
  date: Date,
  events: CalendarEvent[],
  startHour: number = 9,
  endHour: number = 18,
  slotDurationMinutes: number = 30
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(startHour, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, 0, 0, 0);

  let currentSlot = new Date(dayStart);

  while (currentSlot < dayEnd) {
    const slotEnd = new Date(currentSlot.getTime() + slotDurationMinutes * 60 * 1000);

    const isOccupied = events.some((event) => {
      return (
        (currentSlot >= event.start && currentSlot < event.end) ||
        (slotEnd > event.start && slotEnd <= event.end) ||
        (currentSlot <= event.start && slotEnd >= event.end)
      );
    });

    slots.push({
      start: new Date(currentSlot),
      end: new Date(slotEnd),
      available: !isOccupied,
    });

    currentSlot = slotEnd;
  }

  return slots;
};