'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, CalendarClock, List, LayoutGrid, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DateInput, DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core';

import {
  formatRangeLabel,
  toEventInput,
  type CalendarLegendItem,
  type WorkforceCalendarEvent,
  type WorkforceCalendarRange,
  type WorkforceCalendarView
} from '../lib/calendar';
import { formatLongDate } from '../lib/labels';

type WorkforceCalendarProps = {
  title: string;
  description?: string;
  events: WorkforceCalendarEvent[];
  loading?: boolean;
  emptyLabel?: string;
  initialView?: WorkforceCalendarView;
  initialDate?: DateInput;
  legend?: CalendarLegendItem[];
  filters?: ReactNode;
  actions?: ReactNode;
  stats?: ReactNode;
  compact?: boolean;
  className?: string;
  onRangeChange?: (range: WorkforceCalendarRange) => void;
  onEventSelect?: (event: WorkforceCalendarEvent | null) => void;
};

const viewOptions: Array<{ value: WorkforceCalendarView; label: string; icon: typeof CalendarDays }> = [
  { value: 'timeGridDay', label: 'Día', icon: CalendarClock },
  { value: 'timeGridWeek', label: 'Semana', icon: CalendarRange },
  { value: 'dayGridMonth', label: 'Mes', icon: CalendarDays },
  { value: 'listMonth', label: 'Agenda', icon: List },
  { value: 'multiMonthYear', label: 'Año', icon: LayoutGrid }
];

function pickResponsiveView(initialView: WorkforceCalendarView) {
  if (typeof window === 'undefined') {
    return initialView;
  }

  if (window.innerWidth < 640) {
    return initialView === 'multiMonthYear' ? 'listMonth' : 'listMonth';
  }

  if (window.innerWidth < 1024) {
    if (initialView === 'multiMonthYear') {
      return 'dayGridMonth';
    }
    return initialView === 'dayGridMonth' ? 'timeGridDay' : initialView;
  }

  return initialView;
}

function formatDetailValue(value: string | null | undefined) {
  return value && value.trim().length ? value : 'No disponible';
}

function toLocalDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rangeLabelToString(range?: WorkforceCalendarRange | null) {
  if (!range) {
    return 'Sin rango seleccionado';
  }

  return formatRangeLabel(range.from, range.to);
}

function CalendarBadge({ tone, label }: { tone: CalendarLegendItem['tone']; label: string }) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function WorkforceCalendar({
  title,
  description,
  events,
  loading = false,
  emptyLabel = 'No hay eventos para el rango seleccionado.',
  initialView = 'dayGridMonth',
  initialDate,
  legend,
  filters,
  actions,
  stats,
  compact = false,
  className,
  onRangeChange,
  onEventSelect
}: WorkforceCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<WorkforceCalendarEvent | null>(null);
  const [currentRange, setCurrentRange] = useState<WorkforceCalendarRange | null>(null);
  const [view, setView] = useState<WorkforceCalendarView>(() => pickResponsiveView(initialView));

  const eventInputs = useMemo(() => events.map((event) => toEventInput(event)), [events]);

  useEffect(() => {
    const nextView = pickResponsiveView(initialView);
    setView(nextView);
  }, [initialView]);

  useEffect(() => {
    onEventSelect?.(selectedEvent);
  }, [onEventSelect, selectedEvent]);

  function changeView(nextView: WorkforceCalendarView) {
    const api = calendarRef.current?.getApi();
    setView(nextView);
    api?.changeView(nextView);
  }

  function navigate(action: 'prev' | 'today' | 'next') {
    const api = calendarRef.current?.getApi();
    if (!api) {
      return;
    }

    api[action]();
  }

  function handleDatesSet(arg: DatesSetArg) {
    const endInclusive = new Date(arg.end);
    endInclusive.setDate(endInclusive.getDate() - 1);
    const range = {
      from: toLocalDateString(arg.start),
      to: toLocalDateString(endInclusive)
    };

    setCurrentRange(range);
    onRangeChange?.(range);
  }

  function handleEventClick(arg: EventClickArg) {
    const details = arg.event.extendedProps as Partial<WorkforceCalendarEvent> & {
      kind?: WorkforceCalendarEvent['kind'];
      subtitle?: string | null;
      location?: string | null;
      statusLabel?: string | null;
      summary?: string | null;
      description?: string | null;
      details?: Array<{ label: string; value: string }>;
    };

    setSelectedEvent({
      id: arg.event.id,
      title: arg.event.title,
      start: arg.event.start?.toISOString() ?? '',
      end: arg.event.end?.toISOString() ?? null,
      allDay: arg.event.allDay,
      kind: details.kind ?? 'schedule',
      subtitle: details.subtitle ?? undefined,
      location: details.location ?? undefined,
      statusLabel: details.statusLabel ?? undefined,
      summary: details.summary ?? undefined,
      description: details.description ?? undefined,
      details: details.details ?? []
    });
  }

  function renderEventContent(arg: EventContentArg) {
    const details = arg.event.extendedProps as Partial<WorkforceCalendarEvent> & {
      subtitle?: string | null;
      summary?: string | null;
      statusLabel?: string | null;
    };

    return (
      <div className={`workforce-event workforce-event--${details.kind ?? 'schedule'}`}>
        <div className="workforce-event__title-row">
          <strong className="workforce-event__title">{arg.event.title}</strong>
          {details.statusLabel ? <span className="workforce-event__status">{details.statusLabel}</span> : null}
        </div>
        {details.subtitle ? <span className="workforce-event__subtitle">{details.subtitle}</span> : null}
        {details.summary ? <span className="workforce-event__summary">{details.summary}</span> : null}
      </div>
    );
  }

  const availableViews = viewOptions.filter((option) => {
    if (compact && option.value === 'multiMonthYear') {
      return false;
    }
    return true;
  });

  return (
    <section className={`panel stack workforce-calendar ${className ?? ''}`.trim()}>
      <div className="toolbar workforce-calendar__header">
        <div className="stack" style={{ gap: '0.35rem' }}>
          <span className="eyebrow">Calendario</span>
          <h2 className="section-title">{title}</h2>
          {description ? <p className="meta">{description}</p> : null}
        </div>
        <div className="hero-actions workforce-calendar__actions">{actions}</div>
      </div>

      {stats ? <div className="page-stats">{stats}</div> : null}

      {filters ? <div className="workforce-calendar__filters">{filters}</div> : null}

      <div className="workforce-calendar__chrome">
        <div className="calendar-toolbar">
          <div className="calendar-toolbar__nav">
            <button className="button button-secondary" type="button" onClick={() => navigate('prev')} aria-label="Anterior">
              <ChevronLeft size={16} />
            </button>
            <button className="button button-secondary" type="button" onClick={() => navigate('today')}>
              Hoy
            </button>
            <button className="button button-secondary" type="button" onClick={() => navigate('next')} aria-label="Siguiente">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="calendar-toolbar__title">
            <strong>{rangeLabelToString(currentRange)}</strong>
          </div>

          <div className="calendar-toolbar__views">
            {availableViews.map((option) => {
              const Icon = option.icon;
              const active = view === option.value;
              return (
                <button
                  key={option.value}
                  className={`button ${active ? 'button-primary' : 'button-secondary'}`}
                  type="button"
                  onClick={() => changeView(option.value)}
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {legend?.length ? (
        <div className="workforce-calendar__legend">
          {legend.map((item) => (
            <CalendarBadge key={item.label} tone={item.tone} label={item.label} />
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="workforce-calendar__loading">
          <div className="skeleton skeleton--line" style={{ width: '11rem' }} />
          <div className="skeleton skeleton--block" style={{ minHeight: '26rem' }} />
        </div>
      ) : eventInputs.length ? (
        <div className="workforce-calendar__content">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin]}
            locale="es"
            firstDay={1}
            weekText="Sem"
            allDayText="Todo el día"
            moreLinkText="más"
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Agenda'
            }}
            initialView={view}
            initialDate={initialDate}
            headerToolbar={false}
            height="auto"
            expandRows
            nowIndicator
            fixedWeekCount={false}
            dayMaxEvents={3}
            moreLinkClick="day"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventDisplay="block"
            events={eventInputs}
            allDaySlot
          />
        </div>
      ) : (
        <div className="calendar-empty-state panel">
          <strong>{emptyLabel}</strong>
          <span className="muted">Usa la navegación o cambia de vista para consultar otro rango.</span>
        </div>
      )}

      {selectedEvent ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setSelectedEvent(null)}>
          <div
            className="dialog-card workforce-calendar__dialog"
            role="dialog"
            aria-modal="true"
            aria-label={selectedEvent.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="toolbar">
              <div className="stack" style={{ gap: '0.2rem' }}>
                <span className="eyebrow">{selectedEvent.statusLabel ?? 'Detalle'}</span>
                <h3 className="section-title">{selectedEvent.title}</h3>
                {selectedEvent.subtitle ? <p className="meta">{selectedEvent.subtitle}</p> : null}
              </div>
              <button className="button button-secondary" type="button" onClick={() => setSelectedEvent(null)}>
                <X size={16} />
                Cerrar
              </button>
            </div>

            <div className="stack">
              <p className="meta">
                {selectedEvent.start
                  ? selectedEvent.allDay
                    ? formatLongDate(selectedEvent.start)
                    : `${formatLongDate(selectedEvent.start)}${selectedEvent.end ? ` - ${formatLongDate(selectedEvent.end)}` : ''}`
                  : 'Sin fecha'}
              </p>

              {selectedEvent.location ? <p><strong>Centro:</strong> {selectedEvent.location}</p> : null}
              {selectedEvent.summary ? <p><strong>Resumen:</strong> {selectedEvent.summary}</p> : null}
              {selectedEvent.description ? <p>{selectedEvent.description}</p> : null}

              {selectedEvent.details?.length ? (
                <div className="calendar-detail-grid">
                  {selectedEvent.details.map((item) => (
                    <article className="calendar-detail-card" key={item.label}>
                      <span className="muted">{item.label}</span>
                      <strong>{formatDetailValue(item.value)}</strong>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="hero-actions">
                <button className="button button-secondary" type="button" onClick={() => setSelectedEvent(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
