import type { RoleName, TimeEntryType, VacationStatus, PermissionStatus, Incident } from './api/generated';

export function hasManagementAccess(roles: RoleName[] | undefined | null) {
  if (!roles?.length) {
    return false;
  }

  return (
    roles.includes('ROLE_SUPER_ADMIN') ||
    roles.includes('ROLE_ADMIN') ||
    roles.includes('ROLE_COMPANY_ADMIN') ||
    roles.includes('ROLE_RRHH')
  );
}

export function getRoleLabel(roles: RoleName[] | undefined | null) {
  if (!roles?.length) {
    return 'Empleado';
  }

  if (roles.includes('ROLE_SUPER_ADMIN')) {
    return 'Super admin';
  }

  if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_COMPANY_ADMIN')) {
    return 'Admin de empresa';
  }

  if (roles.includes('ROLE_RRHH')) {
    return 'RRHH';
  }

  return 'Empleado';
}

export function getTimeEntryLabel(type: TimeEntryType) {
  return type === 'ENTRADA' ? 'Entrada' : 'Salida';
}

export function getVacationStatusLabel(status: VacationStatus) {
  const labels: Record<VacationStatus, string> = {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobada',
    DENEGADO: 'Rechazada'
  };

  return labels[status];
}

export function getPermissionStatusLabel(status: PermissionStatus) {
  const labels: Record<PermissionStatus, string> = {
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    DENEGADO: 'Denegado'
  };

  return labels[status];
}

export function getIncidentStateLabel(incident: Incident) {
  return incident.resuelta ? 'Cerrada' : 'Abierta';
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('es-ES').format(value);
}

export function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationLabel(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} h ${String(minutes).padStart(2, '0')} min`;
}

export function formatShortDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

export function formatLongDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Sin registro';
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function formatInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
