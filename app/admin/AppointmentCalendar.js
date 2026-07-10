"use client";

import { useCallback, useMemo, useState } from "react";
import { SITE } from "../site.config";
import { addDaysToDateKey, dayOfWeekForDateKey, getShopDateTime } from "../../lib/shop-time";

const HOURS = SITE.hours;

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime12(t24) {
  const [h, m] = t24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad(m)} ${suffix}`;
}

function getMondayKey(offset) {
  const shopNow = getShopDateTime();
  const day = shopNow.dayOfWeek;
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysToDateKey(shopNow.dateKey, diff + offset * 7);
}

function buildWeek(offset) {
  const mondayKey = getMondayKey(offset);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const key = addDaysToDateKey(mondayKey, i);
    const dayOfWeek = dayOfWeekForDateKey(key);
    const cfg = HOURS.find((h) => h.day === dayOfWeek);
    if (!cfg || !cfg.open) continue;
    days.push({
      date: new Date(`${key}T12:00:00Z`),
      key,
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
  blockDay: { en: "Block day", es: "Bloquear dia" },
  unblockDay: { en: "Unblock day", es: "Desbloquear dia" },
  block: { en: "Block", es: "Bloquear" },
  unblock: { en: "Unblock", es: "Desbloquear" },
  blocked: { en: "Blocked", es: "Bloqueado" },
  blockMode: { en: "Block/Unblock mode", es: "Modo bloquear" },
  newAppointment: { en: "New Appointment", es: "Nueva Cita" },
  createTitle: { en: "Create Manual Appointment", es: "Crear Cita Manual" },
  customerNameLabel: { en: "Customer name", es: "Nombre del cliente" },
  phoneLabel: { en: "Phone", es: "Telefono" },
  serviceLabel: { en: "Service", es: "Servicio" },
  vehicleLabel: { en: "Vehicle", es: "Vehiculo" },
  notesLabel: { en: "Notes", es: "Notas" },
  dateLabel: { en: "Date (YYYY-MM-DD)", es: "Fecha (YYYY-MM-DD)" },
  timeLabel: { en: "Time", es: "Hora" },
  create: { en: "Create", es: "Crear" },
  creating: { en: "Creating...", es: "Creando..." },
  cancel: { en: "Cancel", es: "Cancelar" },
  createDateHint: { en: "e.g. 2026-07-15. Must be a future business day.",
    es: "ej. 2026-07-15. Debe ser un dia laboral futuro." },
};

const APPT_STATUSES = [
  { value: "requested", label: COPY.requested },
  { value: "confirmed", label: COPY.confirmed },
  { value: "completed", label: COPY.completed },
  { value: "no-show", label: COPY.noShow },
  { value: "canceled", label: COPY.canceled },
];

export default function AppointmentCalendar({ appointments, blockedSlots = [], t, onSchedule, onUnschedule, onStatus, onDelete, onBlock, onUnblock, onCreate, disabled, updatingId }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduling, setScheduling] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [blockMode, setBlockMode] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerName: "",
    phone: "",
    service: "",
    vehicle: "",
    notes: "",
    date: "",
    time: "",
  });
  const [createError, setCreateError] = useState("");

  const days = useMemo(() => buildWeek(weekOffset), [weekOffset]);
  const todayStr = getShopDateTime().dateKey;

  const blockedMap = useMemo(() => {
    const set = new Set();
    const daySet = new Set();
    blockedSlots.forEach((s) => {
      if (s.time === "all") daySet.add(s.date);
      else set.add(`${s.date}_${s.time}`);
    });
    return { set, daySet };
  }, [blockedSlots]);

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

  const selectedAppt = useMemo(() => (selectedId ? appointments.find((a) => a.id === selectedId) : null), [selectedId, appointments]);

  const handleSlotClick = useCallback(
    (dayKey, time, day) => {
      const slots = slotsForDay(day.open, day.close);
      if (!slots.includes(time)) return;

      if (blockMode) {
        const cellKey = `${dayKey}_${time}`;
        if (blockedMap.set.has(cellKey) || blockedMap.daySet.has(dayKey)) {
          onUnblock(dayKey, time);
        } else if (!bookedMap[cellKey]) {
          onBlock(dayKey, time);
        }
        return;
      }

      if (bookedMap[`${dayKey}_${time}`]) {
        const appt = bookedMap[`${dayKey}_${time}`];
        setSelectedId((prev) => (prev === appt.id ? null : appt.id));
        return;
      }
      if (dayKey < todayStr) return;
      if (blockedMap.set.has(`${dayKey}_${time}`) || blockedMap.daySet.has(dayKey)) return;
      if (scheduling) {
        onSchedule(scheduling, dayKey, time);
        setScheduling(null);
      }
    },
    [scheduling, bookedMap, blockedMap, todayStr, onSchedule, onBlock, onUnblock, blockMode],
  );

  const handleDayBlock = useCallback(
    (dayKey) => {
      if (blockedMap.daySet.has(dayKey)) {
        onUnblock(dayKey, "all");
      } else {
        onBlock(dayKey, "all");
      }
    },
    [blockedMap, onBlock, onUnblock],
  );

  const handleScheduleClick = useCallback((id) => {
    setScheduling((prev) => (prev === id ? null : id));
    setSelectedId(null);
    setBlockMode(false);
  }, []);

  const handleCreateField = useCallback((field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateError("");
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const date = createForm.date.trim();
    const time = createForm.time;
    if (!date || !time) {
      setCreateError(t({ en: "Date and time are required.", es: "Fecha y hora son requeridas." }));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setCreateError(t({ en: "Date must be in YYYY-MM-DD format.", es: "La fecha debe estar en formato YYYY-MM-DD." }));
      return;
    }
    onCreate({
      customerName: createForm.customerName.trim(),
      phone: createForm.phone.trim(),
      service: createForm.service.trim(),
      vehicle: createForm.vehicle.trim(),
      notes: createForm.notes.trim(),
      scheduledDate: date,
      scheduledTime: time,
    });
    setShowCreateForm(false);
    setCreateForm({ customerName: "", phone: "", service: "", vehicle: "", notes: "", date: "", time: "" });
  }, [createForm, onCreate, t]);

  const handleOpenCreate = useCallback(() => {
    setShowCreateForm((prev) => !prev);
    setScheduling(null);
    setSelectedId(null);
    setBlockMode(false);
    setCreateError("");
  }, []);

  const weekLabel = useMemo(() => {
    if (!days.length) return "";
    const opts = { month: "short", day: "numeric" };
    return `${days[0].date.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" })} - ${days[days.length - 1].date.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" })}`;
  }, [days]);

  const cells = [];
  cells.push(<div key="corner" className="cal__corner" />);
  days.forEach((day) => {
    const isDayBlocked = blockedMap.daySet.has(day.key);
    cells.push(
      <div key={`h-${day.key}`} className={`cal__day-header ${day.key === todayStr ? "cal__day-header--today" : ""} ${isDayBlocked ? "cal__day-header--blocked" : ""}`}>
        <span className="cal__day-name">{t(day.label)}</span>
        <span className="cal__day-num">{day.date.getUTCDate()}</span>
        {blockMode && (
          <button
            type="button"
            className={`cal__block-day-btn ${isDayBlocked ? "cal__block-day-btn--active" : ""}`}
            onClick={() => handleDayBlock(day.key)}
            disabled={disabled}
          >
            {isDayBlocked ? t(COPY.unblockDay) : t(COPY.blockDay)}
          </button>
        )}
      </div>,
    );
  });

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
      const isBlocked = blockedMap.set.has(cellKey) || blockedMap.daySet.has(day.key);
      const canBook = isActive && !booked && !isPast && !isBlocked && scheduling;

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
            isBlocked && isActive && "cal__slot--blocked",
            selectedId && booked?.id === selectedId && "cal__slot--selected",
            blockMode && isActive && !booked && "cal__slot--blockable",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => isActive && handleSlotClick(day.key, time, day)}
          role={canBook || booked || (blockMode && isActive) ? "button" : undefined}
          tabIndex={canBook || booked || (blockMode && isActive) ? 0 : undefined}
        >
          {booked && (
            <div className="cal__appt">
              <strong>{booked.service || "Appt"}</strong>
              <span>{booked.customerName || booked.phone || ""}</span>
            </div>
          )}
          {isBlocked && isActive && !booked && (
            <span className="cal__blocked-label">{t(COPY.blocked)}</span>
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
        <button
          type="button"
          className={`btn btn--small ${blockMode ? "btn--danger" : "btn--ghost"}`}
          onClick={() => { setBlockMode((b) => !b); setScheduling(null); setSelectedId(null); }}
        >
          {blockMode ? t(COPY.cancel) : t(COPY.blockMode)}
        </button>
        <button
          type="button"
          className={`btn btn--small ${showCreateForm ? "btn--primary" : "btn--ghost"}`}
          onClick={handleOpenCreate}
          disabled={disabled}
        >
          {t(COPY.newAppointment)}
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

      {blockMode && (
        <div className="cal__banner cal__banner--block">
          <span>{t({ en: "Click slots or days to block/unblock. Blocked slots won't be offered to customers.", es: "Haz clic en horarios o dias para bloquear/desbloquear. Los horarios bloqueados no se ofreceran a los clientes." })}</span>
        </div>
      )}

      {showCreateForm && (
        <div className="cal__create-form">
          <div className="cal__create-form-head">
            <h4>{t(COPY.createTitle)}</h4>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => { setShowCreateForm(false); setCreateError(""); }}>
              {t(COPY.close)}
            </button>
          </div>
          {createError && <p className="cal__create-error">{createError}</p>}
          <div className="cal__create-form-grid">
            <label className="cal__create-field">
              <span>{t(COPY.customerNameLabel)}</span>
              <input
                value={createForm.customerName}
                onChange={(e) => handleCreateField("customerName", e.target.value)}
                disabled={disabled}
              />
            </label>
            <label className="cal__create-field">
              <span>{t(COPY.phoneLabel)}</span>
              <input
                value={createForm.phone}
                onChange={(e) => handleCreateField("phone", e.target.value)}
                disabled={disabled}
              />
            </label>
            <label className="cal__create-field">
              <span>{t(COPY.serviceLabel)}</span>
              <input
                value={createForm.service}
                onChange={(e) => handleCreateField("service", e.target.value)}
                disabled={disabled}
              />
            </label>
            <label className="cal__create-field">
              <span>{t(COPY.vehicleLabel)}</span>
              <input
                value={createForm.vehicle}
                onChange={(e) => handleCreateField("vehicle", e.target.value)}
                disabled={disabled}
              />
            </label>
            <label className="cal__create-field cal__create-field--wide">
              <span>{t(COPY.dateLabel)}</span>
              <input
                value={createForm.date}
                onChange={(e) => handleCreateField("date", e.target.value)}
                placeholder="2026-07-15"
                disabled={disabled}
              />
              <span className="cal__create-hint">{t(COPY.createDateHint)}</span>
            </label>
            <label className="cal__create-field">
              <span>{t(COPY.timeLabel)}</span>
              <select
                value={createForm.time}
                onChange={(e) => handleCreateField("time", e.target.value)}
                disabled={disabled}
              >
                <option value="">--</option>
                {ALL_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{formatTime12(slot)}</option>
                ))}
              </select>
            </label>
            <label className="cal__create-field cal__create-field--wide">
              <span>{t(COPY.notesLabel)}</span>
              <textarea
                value={createForm.notes}
                onChange={(e) => handleCreateField("notes", e.target.value)}
                rows={3}
                disabled={disabled}
              />
            </label>
          </div>
          <div className="cal__create-form-actions">
            <button
              type="button"
              className="btn btn--primary btn--small"
              onClick={handleCreateSubmit}
              disabled={disabled}
            >
              {disabled ? t(COPY.creating) : t(COPY.create)}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => { setShowCreateForm(false); setCreateError(""); }}
              disabled={disabled}
            >
              {t(COPY.cancel)}
            </button>
          </div>
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
