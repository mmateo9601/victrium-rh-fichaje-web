import { env } from '../config';

export type RoleName = 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_COMPANY_ADMIN' | 'ROLE_RRHH' | 'ROLE_USER';

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationState;
};

export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
  path?: string;
  timestamp?: string;
  requestId?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  user: PublicUser;
};

export type PublicUser = {
  id: number;
  numero: string;
  nombreEmpleado: string;
  companyId: number | null;
  employeeId: number | null;
  roles: RoleName[];
  admin: boolean;
};

export type Company = {
  id: number;
  name: string;
  code: string;
  timezone: string | null;
  workPolicy: Record<string, unknown> | null;
  active: boolean;
};

export type PlanningPeriodStatus = 'DRAFT' | 'PUBLISHED';

export type PlanningPeriod = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  name: string;
  startDate: string;
  endDate: string;
  status: PlanningPeriodStatus;
  version: number;
  publishedAt: string | null;
  publishedById: number | null;
  publishedByNumero: string | null;
  publishedByNombre: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportsSummary = {
  companies: number;
  users: number;
  employees: number;
  workLocations: number;
  shifts: number;
  planningPeriods: number;
  publishedPlanningPeriods: number;
  timeEntries: number;
  vacationsPending: number;
  permissionsPending: number;
  incidentsOpen: number;
  activeSessions: number;
};

export type WorkLocation = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  timezone: string | null;
  active: boolean;
  calendarId: number | null;
  calendarName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeLocationAssignment = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  workLocationId: number;
  workLocationName: string;
  workLocationCode: string;
  validFrom: string;
  validTo: string | null;
  primary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Employee = {
  id: number;
  numero: string;
  nombreEmpleado: string;
  email: string;
  dni: string;
  companyId: number | null;
  companyName: string | null;
  userId: number | null;
  diasVacaciones: number | null;
  horasGeneradas: number | null;
  working: boolean | null;
  enVacaciones: boolean | null;
  deBaja: boolean | null;
  ultimoFichaje: string | null;
  roles: string[];
  active: boolean;
};

export type TimeEntryType = 'ENTRADA' | 'SALIDA';

export type TimeEntry = {
  id: number;
  hora: string;
  dia: string;
  tipo: TimeEntryType;
  origen: string;
  version: number;
  updatedAt: string | null;
  usuarioId: number;
  usuarioNumero: string;
  usuarioNombre: string;
  companyId: number | null;
  companyName: string | null;
};

export type TimeEntryAudit = {
  id: number;
  timeEntryId: number;
  previousDia: string;
  previousHora: string;
  previousTipo: TimeEntryType;
  newDia: string;
  newHora: string;
  newTipo: TimeEntryType;
  previousVersion: number;
  newVersion: number;
  reason: string;
  createdAt: string;
  correctedById: number;
  correctedByNumero: string;
  correctedByNombre: string;
};

export type WorkTimerState = 'NOT_STARTED' | 'WORKING' | 'PAUSED' | 'COMPLETED';

export type WorkTimerBreak = {
  id: number;
  startedAt: string;
  endedAt: string | null;
  seconds: number;
};

export type WorkTimerCurrent = {
  state: WorkTimerState;
  sessionId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  activeBreak: WorkTimerBreak | null;
  workedSeconds: number;
  breakSeconds: number;
  usuarioId: number;
  usuarioNumero: string;
  usuarioNombre: string;
  companyId: number | null;
  companyName: string | null;
};

export type VacationStatus = 'PENDIENTE' | 'APROBADO' | 'DENEGADO';

export type PermissionStatus = 'PENDIENTE' | 'APROBADO' | 'DENEGADO';

export type Vacation = {
  id: number;
  inicio: string;
  fin: string;
  consumidas: boolean;
  estado: VacationStatus;
  aprobado: boolean;
  companyId: number | null;
  companyName: string | null;
  employeeId: number | null;
  employeeNumero: string | null;
  employeeNombre: string | null;
  employeeEmail: string | null;
  employeeDni: string | null;
};

export type Incident = {
  id: number;
  descripcion: string;
  resumen: string;
  dia: string;
  resuelta: boolean;
  explicacion: string | null;
  companyId: number | null;
  companyName: string | null;
  employeeId: number | null;
  employeeNumero: string | null;
  employeeNombre: string | null;
  employeeEmail: string | null;
  employeeDni: string | null;
};

export type IncidentMonthlyStat = {
  month: string;
  total: number;
};

export type IncidentUserStat = {
  employeeId: number | null;
  employeeNumero: string | null;
  employeeNombre: string | null;
  total: number;
};

export type IncidentTopSummary = {
  resumen: string;
  total: number;
};

export type Permission = {
  id: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  estado: PermissionStatus;
  aprobado: boolean;
  companyId: number | null;
  companyName: string | null;
  employeeId: number | null;
  employeeNumero: string | null;
  employeeNombre: string | null;
  employeeEmail: string | null;
  employeeDni: string | null;
};

export type PermissionMonthlyStat = {
  month: string;
  totalMinutes: number;
};

export type PermissionUserStat = {
  employeeId: number | null;
  employeeNumero: string | null;
  employeeNombre: string | null;
  totalMinutes: number;
};

export type CalendarDay = {
  id: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
};

export type Calendar = {
  id: number;
  nombre: string;
  year: number;
  minutosMasEntrada: number;
  minutosMenosEntrada: number;
  active: boolean;
  days: CalendarDay[];
};

export type CalendarListItem = {
  id: number;
  nombre: string;
  year: number;
  minutosMasEntrada: number;
  minutosMenosEntrada: number;
  active: boolean;
  daysCount: number;
};

export type ShiftDay = {
  id: number;
  dayOfWeek: number;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  workingMinutes: number | null;
  crossesMidnight: boolean;
};

export type ShiftSummary = {
  id: number;
  name: string;
  code: string;
  color: string | null;
};

export type Shift = ShiftSummary & {
  description: string | null;
  active: boolean;
  companyId: number | null;
  companyName: string | null;
  days: ShiftDay[];
  assignmentsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateShiftDayRequest = Omit<ShiftDay, 'id'>;

export type CreateShiftRequest = {
  companyId?: number;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  active?: boolean;
  days: CreateShiftDayRequest[];
};

export type UpdateShiftRequest = Partial<CreateShiftRequest>;

export type ShiftAssignment = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  shift: ShiftSummary;
  validFrom: string;
  validTo: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateShiftAssignmentRequest = {
  companyId?: number;
  employeeId: number;
  shiftId: number;
  validFrom: string;
  validTo?: string | null;
  notes?: string | null;
  active?: boolean;
};

export type UpdateShiftAssignmentRequest = Partial<CreateShiftAssignmentRequest>;

export type ShiftOverrideKind = 'SHIFT' | 'OFF';

export type ShiftOverride = {
  id: number;
  companyId: number | null;
  companyName: string | null;
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  shift: ShiftSummary | null;
  date: string;
  kind: ShiftOverrideKind;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateShiftOverrideRequest = {
  companyId?: number;
  employeeId: number;
  shiftId?: number | null;
  date: string;
  kind?: ShiftOverrideKind;
  notes?: string | null;
};

export type UpdateShiftOverrideRequest = Partial<CreateShiftOverrideRequest>;

export type ScheduleCell = {
  date: string;
  dayOfWeek: number;
  label: string;
  workingDay: boolean;
  isHoliday: boolean;
  status: 'WORKING' | 'VACATION' | 'PERMISSION' | 'HOLIDAY' | 'OFF' | 'NO_SHIFT';
  statusLabel: string;
  shift: ShiftSummary | null;
  assignmentId: number | null;
  overrideId: number | null;
  overrideKind: ShiftOverrideKind | null;
  expectedStart: string | null;
  expectedEnd: string | null;
  expectedMinutes: number;
  breakMinutes: number;
  workedMinutes: number;
  differenceMinutes: number;
  lateMinutes: number;
  vacationId: number | null;
  permissionId: number | null;
  incidentId: number | null;
  firstEntry: string | null;
  lastExit: string | null;
};

export type ScheduleRow = {
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  companyId: number | null;
  companyName: string | null;
  days: ScheduleCell[];
};

export type ScheduleEmployee = {
  employeeId: number;
  employeeNumero: string;
  employeeNombre: string;
  companyId: number | null;
  companyName: string | null;
};

export type Schedule = {
  from: string;
  to: string;
  employees: ScheduleEmployee[];
  days: Array<{ date: string; dayOfWeek: number; label: string }>;
  rows: ScheduleRow[];
};

export type LoginRequest = {
  numero: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type CreateCompanyRequest = {
  name: string;
  code: string;
  active?: boolean;
  timezone?: string | null;
  workPolicy?: Record<string, unknown> | null;
};

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;

export type CreateWorkLocationRequest = {
  companyId?: number;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
};

export type UpdateWorkLocationRequest = Partial<CreateWorkLocationRequest> & {
  active?: boolean;
};

export type CreateEmployeeLocationAssignmentRequest = {
  employeeId: number;
  workLocationId: number;
  validFrom: string;
  validTo?: string | null;
  primary?: boolean;
  notes?: string | null;
};

export type UpdateEmployeeLocationAssignmentRequest = Partial<CreateEmployeeLocationAssignmentRequest>;

export type CreateEmployeeRequest = {
  companyId?: number;
  email: string;
  password: string;
  numero: string;
  nombreEmpleado: string;
  dni: string;
  roles: RoleName[];
  diasVacaciones?: number;
  horasGeneradas?: number;
  working?: boolean;
  enVacaciones?: boolean;
  deBaja?: boolean;
};

export type UpdateEmployeeRequest = Partial<CreateEmployeeRequest>;

export type CreateVacationRequest = {
  inicio: string;
  fin: string;
  employeeId?: number;
};

export type ClockTimeEntryRequest = {
  origen?: string;
};

export type CorrectTimeEntryRequest = {
  dia: string;
  hora: string;
  tipo: TimeEntryType;
  motivo: string;
  version: number;
};

export type CreatePermissionRequest = {
  dia: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  employeeId?: number;
};

export type VacationListQuery = ListQuery & {
  estado?: string;
  consumidas?: string;
  aprobado?: string;
  inicioDesde?: string;
  inicioHasta?: string;
  finDesde?: string;
  finHasta?: string;
  employeeId?: number;
};

export type CreateIncidentRequest = {
  descripcion: string;
  resumen: string;
  dia: string;
  explicacion?: string;
  employeeId?: number;
};

export type UpdateIncidentRequest = Partial<CreateIncidentRequest> & {
  resuelta?: boolean;
};

export type IncidentListQuery = ListQuery & {
  resuelta?: string;
  diaDesde?: string;
  diaHasta?: string;
  employeeId?: number;
};

export type TimeEntryListQuery = ListQuery & {
  search?: string;
  numeroUsuario?: string;
  nombreUsuario?: string;
  tipo?: string;
  from?: string;
  to?: string;
};

export type PermissionListQuery = ListQuery & {
  estado?: string;
  aprobado?: string;
  diaDesde?: string;
  diaHasta?: string;
  horaInicioDesde?: string;
  horaInicioHasta?: string;
  horaFinDesde?: string;
  horaFinHasta?: string;
  employeeId?: number;
  employeeNumero?: string;
  employeeNombre?: string;
  employeeDni?: string;
  employeeEmail?: string;
};

export type CreateCalendarDayRequest = {
  dia: string;
  horaInicio: string;
  horaFin: string;
};

export type CreateCalendarRequest = {
  nombre: string;
  year: number;
  minutosMasEntrada: number;
  minutosMenosEntrada: number;
  active?: boolean;
  days: CreateCalendarDayRequest[];
};

export type ApiKey = {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  userNumero: string;
  userNombreEmpleado: string;
  companyId: number | null;
  active: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  plainApiKey?: string;
};

export type CreateApiKeyRequest = {
  name: string;
  description?: string;
  userId: number;
  expiresInDays?: number;
};

export type UpdateCalendarRequest = Partial<CreateCalendarRequest>;

export type CalendarListQuery = {
  search?: string;
  active?: string;
  year?: string;
};

export type PlanningPeriodListQuery = ListQuery & {
  status?: PlanningPeriodStatus | '';
  companyId?: number;
};

export type ApiKeyListQuery = ListQuery & {
  active?: string;
};

export type ListQuery = {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  active?: string;
  working?: string;
  role?: string;
};

export type RequestOptions = {
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

class ApiClientError extends Error {
  constructor(
    public readonly response: ApiError,
    public readonly status: number
  ) {
    super(response.message);
  }
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const baseUrl = new URL(`${env.apiBaseUrl}/`);
  const normalizedPath =
    baseUrl.pathname.replace(/\/+$/, '') === '/api/v1' && path.startsWith('/api/v1')
      ? path.slice('/api/v1'.length) || '/'
      : path;
  const url = new URL(normalizedPath, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      payload ?? {
        statusCode: response.status,
        code: 'HTTP_ERROR',
        message: response.statusText
      },
      response.status
    );
  }

  return (await response.json()) as T;
}

async function requestJsonWithMethod<T>(path: string, method: 'GET' | 'POST' | 'PATCH', options: RequestOptions = {}) {
  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      payload ?? {
        statusCode: response.status,
        code: 'HTTP_ERROR',
        message: response.statusText
      },
      response.status
    );
  }

  return (await response.json()) as T;
}

async function requestNoContent(path: string, method: 'DELETE', options: RequestOptions = {}) {
  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      payload ?? {
        statusCode: response.status,
        code: 'HTTP_ERROR',
        message: response.statusText
      },
      response.status
    );
  }
}

export const api = {
  auth: {
    login: (body: LoginRequest) => requestJsonWithMethod<AuthSession>('/api/v1/auth/login', 'POST', { body }),
    refresh: (body: RefreshRequest) => requestJsonWithMethod<AuthSession>('/api/v1/auth/refresh', 'POST', { body }),
    logout: (body: RefreshRequest) =>
      requestJsonWithMethod<{ message: string }>('/api/v1/auth/logout', 'POST', { body }),
    me: (token: string) => requestJson<AuthSession['user']>('/api/v1/auth/me', { token }),
    changePassword: (token: string, body: ChangePasswordRequest) =>
      requestJsonWithMethod<{ message: string }>('/api/v1/auth/password', 'PATCH', { token, body })
  },
  companies: {
    list: (token: string, query: ListQuery = {}) =>
      requestJson<PaginatedResult<Company>>('/api/v1/companies', { token, query }),
    mine: (token: string) => requestJson<Company>('/api/v1/companies/me', { token }),
    create: (token: string, body: CreateCompanyRequest) =>
      requestJsonWithMethod<Company>('/api/v1/companies', 'POST', { token, body }),
    update: (token: string, id: number, body: UpdateCompanyRequest) =>
      requestJsonWithMethod<Company>(`/api/v1/companies/${id}`, 'PATCH', { token, body })
  },
  workLocations: {
    list: (token: string, query: ListQuery & { active?: string; companyId?: number } = {}) =>
      requestJson<PaginatedResult<WorkLocation>>('/api/v1/work-locations', { token, query }),
    byId: (token: string, id: number) => requestJson<WorkLocation>(`/api/v1/work-locations/${id}`, { token }),
    create: (token: string, body: CreateWorkLocationRequest) =>
      requestJsonWithMethod<WorkLocation>('/api/v1/work-locations', 'POST', { token, body }),
    update: (token: string, id: number, body: UpdateWorkLocationRequest) =>
      requestJsonWithMethod<WorkLocation>(`/api/v1/work-locations/${id}`, 'PATCH', { token, body }),
    activate: (token: string, id: number) =>
      requestJsonWithMethod<WorkLocation>(`/api/v1/work-locations/${id}/activate`, 'POST', { token }),
    deactivate: (token: string, id: number) =>
      requestJsonWithMethod<WorkLocation>(`/api/v1/work-locations/${id}/deactivate`, 'POST', { token }),
    employees: (token: string, id: number, query: ListQuery = {}) =>
      requestJson<PaginatedResult<EmployeeLocationAssignment>>(`/api/v1/work-locations/${id}/employees`, { token, query }),
    assignments: (token: string, query: ListQuery & { employeeId?: number; workLocationId?: number } = {}) =>
      requestJson<PaginatedResult<EmployeeLocationAssignment>>('/api/v1/employee-location-assignments', { token, query }),
    createAssignment: (token: string, body: CreateEmployeeLocationAssignmentRequest) =>
      requestJsonWithMethod<EmployeeLocationAssignment>('/api/v1/employee-location-assignments', 'POST', { token, body }),
    updateAssignment: (token: string, id: number, body: UpdateEmployeeLocationAssignmentRequest) =>
      requestJsonWithMethod<EmployeeLocationAssignment>(`/api/v1/employee-location-assignments/${id}`, 'PATCH', { token, body })
  },
  users: {
    list: (token: string, query: ListQuery = {}) =>
      requestJson<PaginatedResult<PublicUser>>('/api/v1/users', { token, query }),
    mine: (token: string) => requestJson<PublicUser>('/api/v1/users/me', { token }),
    byId: (token: string, id: number) => requestJson<PublicUser>(`/api/v1/users/${id}`, { token })
  },
  employees: {
    list: (token: string, query: ListQuery = {}) =>
      requestJson<PaginatedResult<Employee>>('/api/v1/employees', { token, query }),
    mine: (token: string) => requestJson<Employee>('/api/v1/employees/me', { token }),
    byId: (token: string, id: number) => requestJson<Employee>(`/api/v1/employees/${id}`, { token }),
    create: (token: string, body: CreateEmployeeRequest) =>
      requestJsonWithMethod<Employee>('/api/v1/employees', 'POST', { token, body }),
    update: (token: string, id: number, body: UpdateEmployeeRequest) =>
      requestJsonWithMethod<Employee>(`/api/v1/employees/${id}`, 'PATCH', { token, body }),
    activate: (token: string, id: number) =>
      requestJsonWithMethod<Employee>(`/api/v1/employees/${id}/activate`, 'PATCH', { token }),
    deactivate: (token: string, id: number) =>
      requestJsonWithMethod<Employee>(`/api/v1/employees/${id}/deactivate`, 'PATCH', { token })
  },
  vacations: {
    list: (token: string, query: VacationListQuery = {}) =>
      requestJson<PaginatedResult<Vacation>>('/api/v1/vacations', { token, query }),
    mine: (token: string, query: VacationListQuery = {}) =>
      requestJson<PaginatedResult<Vacation>>('/api/v1/vacations/me', { token, query }),
    byId: (token: string, id: number) => requestJson<Vacation>(`/api/v1/vacations/${id}`, { token }),
    create: (token: string, body: CreateVacationRequest) =>
      requestJsonWithMethod<Vacation>('/api/v1/vacations', 'POST', { token, body }),
    approve: (token: string, id: number) =>
      requestJsonWithMethod<Vacation>(`/api/v1/vacations/${id}/approve`, 'PATCH', { token }),
    deny: (token: string, id: number) =>
      requestJsonWithMethod<Vacation>(`/api/v1/vacations/${id}/deny`, 'PATCH', { token })
  },
  incidents: {
    list: (token: string, query: IncidentListQuery = {}) =>
      requestJson<PaginatedResult<Incident>>('/api/v1/incidents', { token, query }),
    mine: (token: string, query: IncidentListQuery = {}) =>
      requestJson<PaginatedResult<Incident>>('/api/v1/incidents/me', { token, query }),
    byId: (token: string, id: number) => requestJson<Incident>(`/api/v1/incidents/${id}`, { token }),
    create: (token: string, body: CreateIncidentRequest) =>
      requestJsonWithMethod<Incident>('/api/v1/incidents', 'POST', { token, body }),
    update: (token: string, id: number, body: UpdateIncidentRequest) =>
      requestJsonWithMethod<Incident>(`/api/v1/incidents/${id}`, 'PATCH', { token, body }),
    resolve: (token: string, id: number) =>
      requestJsonWithMethod<Incident>(`/api/v1/incidents/${id}/resolve`, 'PATCH', { token }),
    statsMonths: (token: string) => requestJson<IncidentMonthlyStat[]>('/api/v1/incidents/stats/months', { token }),
    statsUsers: (token: string) => requestJson<IncidentUserStat[]>('/api/v1/incidents/stats/users', { token }),
    statsTop: (token: string) => requestJson<IncidentTopSummary[]>('/api/v1/incidents/stats/top', { token })
  },
  timeEntries: {
    current: (token: string) => requestJson<WorkTimerCurrent>('/api/v1/time-entries/me/current', { token }),
    start: (token: string, body: ClockTimeEntryRequest = {}) =>
      requestJsonWithMethod<WorkTimerCurrent>('/api/v1/time-entries/start', 'POST', { token, body }),
    pause: (token: string, sessionId: number) =>
      requestJsonWithMethod<WorkTimerCurrent>(`/api/v1/time-entries/${sessionId}/pause`, 'POST', { token }),
    resume: (token: string, sessionId: number) =>
      requestJsonWithMethod<WorkTimerCurrent>(`/api/v1/time-entries/${sessionId}/resume`, 'POST', { token }),
    finish: (token: string, sessionId: number) =>
      requestJsonWithMethod<WorkTimerCurrent>(`/api/v1/time-entries/${sessionId}/finish`, 'POST', { token }),
    clock: (token: string, body: ClockTimeEntryRequest = {}) =>
      requestJsonWithMethod<TimeEntry>('/api/v1/time-entries/clock', 'POST', { token, body }),
    list: (token: string, query: TimeEntryListQuery = {}) =>
      requestJson<PaginatedResult<TimeEntry>>('/api/v1/time-entries', { token, query }),
    mine: (token: string, query: TimeEntryListQuery = {}) =>
      requestJson<PaginatedResult<TimeEntry>>('/api/v1/time-entries/me', { token, query }),
    byId: (token: string, id: number) => requestJson<TimeEntry>(`/api/v1/time-entries/${id}`, { token }),
    audits: (token: string, id: number) => requestJson<TimeEntryAudit[]>(`/api/v1/time-entries/${id}/audits`, { token }),
    correct: (token: string, id: number, body: CorrectTimeEntryRequest) =>
      requestJsonWithMethod<TimeEntry>(`/api/v1/time-entries/${id}/correction`, 'POST', { token, body })
  },
  permissions: {
    list: (token: string, query: PermissionListQuery = {}) =>
      requestJson<PaginatedResult<Permission>>('/api/v1/permissions', { token, query }),
    mine: (token: string, query: PermissionListQuery = {}) =>
      requestJson<PaginatedResult<Permission>>('/api/v1/permissions/me', { token, query }),
    byId: (token: string, id: number) => requestJson<Permission>(`/api/v1/permissions/${id}`, { token }),
    create: (token: string, body: CreatePermissionRequest) =>
      requestJsonWithMethod<Permission>('/api/v1/permissions', 'POST', { token, body }),
    approve: (token: string, id: number) =>
      requestJsonWithMethod<Permission>(`/api/v1/permissions/${id}/approve`, 'PATCH', { token }),
    deny: (token: string, id: number) =>
      requestJsonWithMethod<Permission>(`/api/v1/permissions/${id}/deny`, 'PATCH', { token }),
    delete: (token: string, id: number) => requestNoContent(`/api/v1/permissions/${id}`, 'DELETE', { token }),
    statsMonths: (token: string) => requestJson<PermissionMonthlyStat[]>('/api/v1/permissions/stats/months', { token }),
    statsUsers: (token: string) => requestJson<PermissionUserStat[]>('/api/v1/permissions/stats/users', { token })
  },
  calendars: {
    list: (token: string, query: CalendarListQuery = {}) =>
      requestJson<CalendarListItem[]>('/api/v1/calendars', { token, query }),
    listDto: (token: string, query: CalendarListQuery = {}) =>
      requestJson<CalendarListItem[]>('/api/v1/calendars/list/dto', { token, query }),
    byId: (token: string, id: number) => requestJson<Calendar>(`/api/v1/calendars/${id}`, { token }),
    create: (token: string, body: CreateCalendarRequest) =>
      requestJsonWithMethod<Calendar>('/api/v1/calendars', 'POST', { token, body }),
    update: (token: string, id: number, body: UpdateCalendarRequest) =>
      requestJsonWithMethod<Calendar>(`/api/v1/calendars/${id}`, 'PATCH', { token, body }),
    delete: (token: string, id: number) => requestNoContent(`/api/v1/calendars/${id}`, 'DELETE', { token })
  },
  planningPeriods: {
    list: (token: string, query: PlanningPeriodListQuery = {}) =>
      requestJson<PaginatedResult<PlanningPeriod>>('/api/v1/planning-periods', { token, query }),
    byId: (token: string, id: number) => requestJson<PlanningPeriod>(`/api/v1/planning-periods/${id}`, { token }),
    create: (token: string, body: { companyId?: number; name: string; startDate: string; endDate: string; notes?: string | null }) =>
      requestJsonWithMethod<PlanningPeriod>('/api/v1/planning-periods', 'POST', { token, body }),
    update: (
      token: string,
      id: number,
      body: Partial<{ companyId?: number; name: string; startDate: string; endDate: string; notes?: string | null }>
    ) => requestJsonWithMethod<PlanningPeriod>(`/api/v1/planning-periods/${id}`, 'PATCH', { token, body }),
    publish: (token: string, id: number) =>
      requestJsonWithMethod<PlanningPeriod>(`/api/v1/planning-periods/${id}/publish`, 'POST', { token }),
    unpublish: (token: string, id: number) =>
      requestJsonWithMethod<PlanningPeriod>(`/api/v1/planning-periods/${id}/unpublish`, 'POST', { token })
  },
  reports: {
    summary: (token: string) => requestJson<ReportsSummary>('/api/v1/reports/summary', { token })
  },
  shifts: {
    list: (token: string, query: ListQuery = {}) =>
      requestJson<Shift[]>('/api/v1/shifts', { token, query }),
    byId: (token: string, id: number) => requestJson<Shift>(`/api/v1/shifts/${id}`, { token }),
    create: (token: string, body: CreateShiftRequest) =>
      requestJsonWithMethod<Shift>('/api/v1/shifts', 'POST', { token, body }),
    update: (token: string, id: number, body: UpdateShiftRequest) =>
      requestJsonWithMethod<Shift>(`/api/v1/shifts/${id}`, 'PATCH', { token, body }),
    activate: (token: string, id: number) =>
      requestJsonWithMethod<Shift>(`/api/v1/shifts/${id}/activate`, 'POST', { token }),
    deactivate: (token: string, id: number) =>
      requestJsonWithMethod<Shift>(`/api/v1/shifts/${id}/deactivate`, 'POST', { token }),
    me: (token: string, query: { date?: string } = {}) =>
      requestJson<ScheduleCell>(`/api/v1/shifts/me`, { token, query }),
    assignments: (token: string, id: number) => requestJson<ShiftAssignment[]>(`/api/v1/shifts/${id}/assignments`, { token })
  },
  shiftAssignments: {
    list: (token: string, query: { employeeId?: number; shiftId?: number; active?: string } = {}) =>
      requestJson<ShiftAssignment[]>('/api/v1/shift-assignments', { token, query }),
    create: (token: string, body: CreateShiftAssignmentRequest) =>
      requestJsonWithMethod<ShiftAssignment>('/api/v1/shift-assignments', 'POST', { token, body }),
    update: (token: string, id: number, body: UpdateShiftAssignmentRequest) =>
      requestJsonWithMethod<ShiftAssignment>(`/api/v1/shift-assignments/${id}`, 'PATCH', { token, body }),
    listOverrides: (token: string, query: { employeeId?: number; date?: string } = {}) =>
      requestJson<ShiftOverride[]>('/api/v1/shift-assignments/overrides', { token, query }),
    createOverride: (token: string, body: CreateShiftOverrideRequest) =>
      requestJsonWithMethod<ShiftOverride>('/api/v1/shift-assignments/overrides', 'POST', { token, body }),
    updateOverride: (token: string, id: number, body: UpdateShiftOverrideRequest) =>
      requestJsonWithMethod<ShiftOverride>(`/api/v1/shift-assignments/overrides/${id}`, 'PATCH', { token, body })
  },
  schedule: {
    list: (token: string, query: { from?: string; to?: string; employeeId?: number; shiftId?: number } = {}) =>
      requestJson<Schedule>('/api/v1/schedule', { token, query }),
    me: (token: string, query: { from?: string; to?: string; shiftId?: number } = {}) =>
      requestJson<Schedule>('/api/v1/schedule/me', { token, query }),
    employee: (token: string, id: number, query: { from?: string; to?: string; shiftId?: number } = {}) =>
      requestJson<Schedule>(`/api/v1/employees/${id}/schedule`, { token, query }),
    employeeAssignments: (token: string, id: number) =>
      requestJson<ShiftAssignment[]>(`/api/v1/employees/${id}/shifts`, { token })
  },
  apiKeys: {
    list: (token: string, query: ApiKeyListQuery = {}) =>
      requestJson<PaginatedResult<ApiKey>>('/api/v1/api-keys', { token, query }),
    byId: (token: string, id: number) => requestJson<ApiKey>(`/api/v1/api-keys/${id}`, { token }),
    byUser: (token: string, userId: number, query: ApiKeyListQuery = {}) =>
      requestJson<PaginatedResult<ApiKey>>(`/api/v1/api-keys/users/${userId}`, { token, query }),
    create: (token: string, body: CreateApiKeyRequest) =>
      requestJsonWithMethod<ApiKey>('/api/v1/api-keys', 'POST', { token, body }),
    activate: (token: string, id: number) =>
      requestJsonWithMethod<ApiKey>(`/api/v1/api-keys/${id}/activate`, 'PATCH', { token }),
    deactivate: (token: string, id: number) =>
      requestJsonWithMethod<ApiKey>(`/api/v1/api-keys/${id}/deactivate`, 'PATCH', { token }),
    delete: (token: string, id: number) => requestNoContent(`/api/v1/api-keys/${id}`, 'DELETE', { token })
  }
} as const;

export { ApiClientError };
