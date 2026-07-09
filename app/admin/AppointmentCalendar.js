"use client";

import { useCallback, useMemo, useState } from "react";
import { SITE } from "../site.config";

const HOURS = SITE.hours;

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime12(t24) {
  const [h, m] = t24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad(m)} ${suffix}`;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getMonday(offset) {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff + offset * 7);
}

function buildWeek(offset) {
  const mon = getMonday(offset);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const cfg = HOURS.find((h) => h.day === d.getDay());
    if (!cfg || !cfg.open) continue;
    days.push({
      date: d,
      key: toDateStr(d),
      label: cfg.label,
      open: cfg.open,
      close: cfg.close,
    });
  }
  return days;
}

function slotsForDay(open, close) {
  if (!open || !close) return [];
  const [oh] = open.split(":").map(Number);
  const [ch] = close.split(":").map(Number);
  const s = [];
  for (let h = oh; h < ch; h++) s.push(`${pad(h)}:00`);
  return s;
}

function allTimeSlots() {
  const set = new Set();
  HOURS.forEach((h) => {
    if (h.open) slotsForDay(h.open, h.close).forEach((s) => set.add(s));
  });
  return [...set].sort();
}

const ALL_SLOTS = allTimeSlots();

const COPY = {
  thisWeek: { en: "This week", es: "Esta semana" },
  schedulingBanner: { en: "Click an available slot to schedule", es: "Haz clic en un horario disponible" },
  cancel: { en: "Cancel", es: "Cancelar" },
  pending: { en: "Pending Requests", es: "Solicitudes Pendientes" },
  noPending: { en: "No pending appointment requests.", es: "No hay solicitudes pendientes." },
  noService: { en: "Service not specified", es: "Servicio no especificado" },
  unknown: { en: "Unknown", es: "Desconocido" },
  schedule: { en: "Schedule", es: "Agendar" },
  picking: { en: "Picking slot...", es: "Eligiendo horario..." },
  delete: { en: "Delete", es: "Eliminar" },
  unschedule: { en: "Unschedule", es: "Desagendar" },
  close: { en: "Close", es: "Cerrar" },
  scheduled: { en: "Scheduled", es: "Agendados" },
  noScheduled: { en: "No scheduled appointments this week.", es: "No hay citas agendadas esta semana." },
  status: { en: "Status", es: "Estado" },
  confirmed: { en: "Confirmed", es: "Confirmada" },
  requested: { en: "Requested", es: "Solicitada" },
  completed: { en: "Completed", es: "Completada" },
  noShow: { en: "No-show", es: "No llego" },
  canceled: { en: "Canceled", es: "Cancelada" },
  preferred: { en: "Preferred", es: "Preferido" },
};

const APPT_STATUSES = [
  { value: "requested", label: COPY.requested },
  { value: "confirmed", label: COPY.confirmed },
  { value: "completed", label: COPY.completed },
  { value: "no-show", label: COPY.noShow },
  { value: "canceled", label: COPY.canceled },
];

export default function AppointmentCalendar({ appointments, t, onSchedule, onUnschedule, onStatus, onDelete, disabled, updatingId }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduling, setScheduling] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const days = useMemo(() => buildWeek(weekOffset), [weekOffset]);
  const todayStr = toDateStr(new Date());

  const bookedMap = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (a.scheduledDate && a.scheduledTime && (a.status === "confirmed" || a.status === "requested")) {
        map[`${a.scheduledDate}_${a.scheduledTime}`] = a;
      }
    });
    return map;
  }, [appointments]);

  const unscheduled = useMemo(
    () => appointments.filter((a) => !a.scheduledDate && a.status !== "canceled" && a.status !== "completed" && a.status !== "no-show"),
    [appointments],
  );

  const weekScheduled = useMemo(() => {
    const dayKeys = new Set(days.map((d) => d.key));
    return appointments.filter((a) => a.scheduledDate && dayKeys.has(a.scheduledDate) && (a.status === "confirmed" || a.status === "requested"));
  }, [appointments, days]);

  const selectedAppt = useMemo(() => (selectedId ? appointments.find((a) => a.id === selectedId) : null), [selectedId, appointments]);

  const handleSlotClick = useCallback(
    (dayKey, time, day) => {
      const slots = slotsForDay(day.open, day.close);
      if (!slots.includes(time)) return;
      if (bookedMap[`${dayKey}_${time}`]) {
        const appt = bookedMap[`${dayKey}_${time}`];
        setSelectedId((prev) => (prev === appt.id ? null : appt.id));
        return;
      }
      if (dayKey < todayStr) return;
      if (scheduling) {
        onSchedule(scheduling, dayKey, time);
        setScheduling(null);
      }
    },
    [scheduling, bookedMap, todayStr, onSchedule],
  );

  const handleScheduleClick = useCallback((id) => {
    setScheduling((prev) => (prev === id ? null : id));
    setSelectedId(null);
  }, []);

  const weekLabel = useMemo(() => {
    if (!days.length) return "";
    const opts = { month: "short", day: "numeric" };
    return `${days[0].date.toLocaleDateString("en-US", opts)} - ${days[days.length - 1].date.toLocaleDateString("en-US", opts)}`;
  }, [days]);

  const cells = [];
  cells.push(<div key="corner" className="cal__corner" />);
  days.forEach((day) =>
    cells.push(
      <div key={`h-${day.key}`} className={`cal__day-header ${day.key === todayStr ? "cal__day-header--today" : ""}`}>
        <span className="cal__day-name">{t(day.label)}</span>
        <span className="cal__day-num">{day.date.getDate()}</span>
      </div>,
    ),
  );

  ALL_SLOTS.forEach((time) => {
    cells.push(
      <div key={`t-${time}`} className="cal__time">
        {formatTime12(time)}
      </div>,
    );
    days.forEach((day) => {
      const slots = slotsForDay(day.open, day.close);
      const isActive = slots.includes(time);
      const cellKey = `${day.key}_${time}`;
      const booked = bookedMap[cellKey];
      const isPast = day.key < todayStr;
      const canBook = isActive && !booked && !isPast && scheduling;

      cells.push(
        <div
          key={cellKey}
          className={[
            "cal__slot",
            day.key === todayStr && "cal__slot--today",
            !isActive && "cal__slot--closed",
            booked && "cal__slot--booked",
            canBook && "cal__slot--available",
            isPast && "cal__slot--past",
            selectedId && booked?.id === selectedId && "cal__slot--selected",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => isActive && handleSlotClick(day.key, time, day)}
          role={canBook || booked ? "button" : undefined}
          tabIndex={canBook || booked ? 0 : undefined}
        >
          {booked && (
            <div className="cal__appt">
              <strong>{booked.service || "Appt"}</strong>
              <span>{booked.customerName || booked.phone || ""}</span>
            </div>
          )}
        </div>,
      );
    });
  });

  return (
    <div className="cal">
      <div className="cal__nav">
        <button type="button" onClick={() => setWeekOffset((o) => o - 1)} className="btn btn--ghost btn--small" aria-label="Previous week">
          &#8249;
        </button>
        <button type="button" onClick={() => setWeekOffset(0)} className="btn btn--ghost btn--small">
          {t(COPY.thisWeek)}
        </button>
        <span className="cal__week-label">{weekLabel}</span>
        <button type="button" onClick={() => setWeekOffset((o) => o + 1)} className="btn btn--ghost btn--small" aria-label="Next week">
          &#8250;
        </button>
      </div>

      {scheduling && (
        <div className="cal__banner">
          <span>{t(COPY.schedulingBanner)}</span>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setScheduling(null)}>
            {t(COPY.cancel)}
          </button>
        </div>
      )}

      <div className="cal__scroll">
        <div className="cal__grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          {cells}
        </div>
      </div>

      {selectedAppt && (
        <div className="cal__detail">
          <div className="cal__detail-head">
            <h4>{selectedAppt.service || t(COPY.noService)}</h4>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setSelectedId(null)}>
              {t(COPY.close)}
            </button>
          </div>
          <div className="cal__detail-grid">
            {selectedAppt.customerName && <span>{selectedAppt.customerName}</span>}
            {selectedAppt.phone && <span>{selectedAppt.phone}</span>}
            {selectedAppt.vehicle && <span>{selectedAppt.vehicle}</span>}
            {selectedAppt.scheduledDate && (
              <span>
                {new Date(selectedAppt.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                {formatTime12(selectedAppt.scheduledTime)}
              </span>
            )}
          </div>
          {selectedAppt.notes && <p className="cal__detail-notes">{selectedAppt.notes}</p>}
          <div className="cal__detail-actions">
            <select
              value={selectedAppt.status}
              onChange={(e) => onStatus("appointment", selectedAppt.id, e.target.value)}
              disabled={updatingId === selectedAppt.id}
            >
              {APPT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                onUnschedule(selectedAppt.id);
                setSelectedId(null);
              }}
              disabled={updatingId === selectedAppt.id}
            >
              {t(COPY.unschedule)}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small cal__delete-btn"
              onClick={() => {
                onDelete("appointment", selectedAppt.id, selectedAppt);
                setSelectedId(null);
              }}
              disabled={updatingId === selectedAppt.id}
            >
              {t(COPY.delete)}
            </button>
          </div>
        </div>
      )}

      <div className="cal__section">
        <h3>
          {t(COPY.pending)} <span className="cal__count">{unscheduled.length}</span>
        </h3>
        {unscheduled.length === 0 && <p className="cal__empty">{t(COPY.noPending)}</p>}
        {unscheduled.map((appt) => (
          <div key={appt.id} className={`cal__card ${scheduling === appt.id ? "cal__card--active" : ""}`}>
            <div className="cal__card-info">
              <strong>{appt.service || t(COPY.noService)}</strong>
              <span>{appt.customerName || appt.phone || t(COPY.unknown)}</span>
              {appt.vehicle && <span>{appt.vehicle}</span>}
              {appt.preferredTime && (
                <span className="cal__card-pref">
                  {t(COPY.preferred)}: {appt.preferredTime}
                </span>
              )}
            </div>
            <div className="cal__card-actions">
              <button
                type="button"
                className={`btn btn--small ${scheduling === appt.id ? "btn--primary" : "btn--ghost"}`}
                onClick={() => handleScheduleClick(appt.id)}
                disabled={disabled}
              >
                {scheduling === appt.id ? t(COPY.picking) : t(COPY.schedule)}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--small cal__delete-btn"
                onClick={() => onDelete("appointment", appt.id, appt)}
                disabled={disabled}
              >
                {t(COPY.delete)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
