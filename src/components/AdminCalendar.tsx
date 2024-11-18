import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Session } from '../types';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AdminCalendarProps {
  sessions: Session[];
  onSelectEvent: (session: Session) => void;
}

export default function AdminCalendar({ sessions, onSelectEvent }: AdminCalendarProps) {
  const events = sessions.map(session => ({
    id: session.id,
    title: session.title,
    start: new Date(session.startTime),
    end: new Date(session.endTime),
    resource: session
  }));

  return (
    <div className="h-[600px] bg-white rounded-lg shadow-md p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={(event) => onSelectEvent(event.resource)}
        views={['month', 'week', 'day']}
        defaultView="week"
      />
    </div>
  );
}