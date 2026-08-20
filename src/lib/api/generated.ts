import { env } from '../config';

export type RoleName = 'ROLE_ADMIN' | 'ROLE_RRHH' | 'ROLE_USER';

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
  active: boolean;
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

export type LoginRequest = {
  numero: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type CreateCompanyRequest = {
  name: string;
  code: string;
  active?: boolean;
};

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;

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
  const url = new URL(`${env.apiBaseUrl}${path}`);
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

export const api = {
  auth: {
    login: (body: LoginRequest) => requestJsonWithMethod<AuthSession>('/api/v1/auth/login', 'POST', { body }),
    refresh: (body: RefreshRequest) => requestJsonWithMethod<AuthSession>('/api/v1/auth/refresh', 'POST', { body }),
    me: (token: string) => requestJson<AuthSession['user']>('/api/v1/auth/me', { token })
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
  }
} as const;

export { ApiClientError };
