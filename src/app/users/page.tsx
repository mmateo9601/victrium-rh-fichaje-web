'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { Modal } from '../../components/modal';
import { api, type Company, type Employee, type PublicUser, type RoleName } from '../../lib/api/generated';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';
import { formatDateTime, getRoleListLabel } from '../../lib/labels';

type UserFilters = {
  search: string;
  role: string;
  active: string;
  companyId: string;
  employeeId: string;
};

type UserFormState = {
  email: string;
  numero: string;
  dni: string;
  nombreEmpleado: string;
  password: string;
  companyId: string;
  employeeId: string;
  roles: RoleName[];
  active: boolean;
};

const ROLE_OPTIONS: RoleName[] = [
  'ROLE_SUPER_ADMIN',
  'ROLE_COMPANY_ADMIN',
  'ROLE_RRHH',
  'ROLE_MANAGER',
  'ROLE_USER',
  'ROLE_AUDITOR',
  'ROLE_WORKFORCE_REPRESENTATIVE'
];

function emptyForm(defaultCompanyId = ''): UserFormState {
  return {
    email: '',
    numero: '',
    dni: '',
    nombreEmpleado: '',
    password: '',
    companyId: defaultCompanyId,
    employeeId: '',
    roles: ['ROLE_USER'],
    active: true
  };
}

export default function UsersPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const roles = getEffectiveRoles(session);
  const canAccess = roles.some((role) => role === 'ROLE_COMPANY_ADMIN' || role === 'ROLE_RRHH' || role === 'ROLE_SUPER_ADMIN');
  const canManageGlobally = roles.includes('ROLE_SUPER_ADMIN');
  const fixedCompanyId = !canManageGlobally ? String(session?.user.companyId ?? '') : '';
  const accessDenied = Boolean(session) && !canAccess;
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    active: '',
    companyId: fixedCompanyId,
    employeeId: ''
  });
  const [form, setForm] = useState<UserFormState>(emptyForm(fixedCompanyId));
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (accessDenied) {
    return null;
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!canAccess) {
      router.replace('/dashboard');
      return;
    }
  }, [router, canAccess]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !canAccess) {
      return;
    }
    const authToken = token;

    async function loadOptions() {
      try {
        if (canManageGlobally) {
          const companyResult = await api.companies.list(authToken, { pageSize: 100 });
          setCompanies(companyResult.data);
        } else {
          const mine = await api.companies.mine(authToken);
          setCompanies([mine]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las empresas');
      }
    }

    void loadOptions();
  }, [canAccess, canManageGlobally]);

  useEffect(() => {
    const token = getAccessToken();
    const scopeCompanyId = (form.companyId || filters.companyId || '').trim();
    if (!token || !canAccess || !scopeCompanyId) {
      setEmployees([]);
      return;
    }

    const authToken = token;
    const companyId = Number(scopeCompanyId);

    async function loadEmployees() {
      try {
        const result = await api.employees.list(authToken, { companyId, pageSize: 100 });
        setEmployees(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los empleados');
      }
    }

    void loadEmployees();
  }, [canAccess, filters.companyId, form.companyId]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !canAccess) {
      return;
    }
    const authToken = token;

    async function loadUsers() {
      setLoading(true);
      try {
        const result = await api.users.list(authToken, {
          search: filters.search || undefined,
          role: filters.role || undefined,
          active: filters.active || undefined,
          companyId: filters.companyId ? Number(filters.companyId) : undefined,
          employeeId: filters.employeeId ? Number(filters.employeeId) : undefined,
          pageSize: 100
        });
        setUsers(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    }

    void loadUsers();
  }, [canAccess, filters.search, filters.role, filters.active, filters.companyId, filters.employeeId]);

  function beginCreate() {
    setSelectedUser(null);
    setForm(emptyForm(fixedCompanyId));
    setEditorOpen(true);
  }

  function beginEdit(user: PublicUser) {
    setSelectedUser(user);
    setForm({
      email: user.email,
      numero: user.numero,
      dni: '',
      nombreEmpleado: user.nombreEmpleado,
      password: '',
      companyId: user.companyId ? String(user.companyId) : fixedCompanyId,
      employeeId: user.employeeId ? String(user.employeeId) : '',
      roles: user.roles,
      active: user.active
    });
    setEditorOpen(true);
  }

  function closeEditor() {
    setSelectedUser(null);
    setForm(emptyForm(fixedCompanyId));
    setEditorOpen(false);
  }

  async function saveUser() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const basePayload = {
        email: form.email.trim(),
        numero: form.numero.trim(),
        dni: form.dni.trim(),
        nombreEmpleado: form.nombreEmpleado.trim(),
        companyId: form.companyId ? Number(form.companyId) : undefined,
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        roles: form.roles,
        active: form.active
      };

      if (selectedUser) {
        const payload = {
          ...basePayload,
          ...(form.password ? { password: form.password } : {})
        };
        await api.users.update(token, selectedUser.id, payload);
      } else {
        if (!form.password) {
          throw new Error('La contraseña inicial es obligatoria para crear usuarios');
        }
        await api.users.create(token, {
          ...basePayload,
          password: form.password
        });
      }

      closeEditor();
      const refreshed = await api.users.list(token, {
        search: filters.search || undefined,
        role: filters.role || undefined,
        active: filters.active || undefined,
        companyId: filters.companyId ? Number(filters.companyId) : undefined,
        employeeId: filters.employeeId ? Number(filters.employeeId) : undefined,
        pageSize: 100
      });
      setUsers(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario');
    } finally {
      setSaving(false);
    }
  }

  async function setUserActive(user: PublicUser, active: boolean) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setError(null);
    try {
      if (active) {
        await api.users.activate(token, user.id);
      } else {
        await api.users.deactivate(token, user.id);
      }
      const refreshed = await api.users.list(token, {
        search: filters.search || undefined,
        role: filters.role || undefined,
        active: filters.active || undefined,
        companyId: filters.companyId ? Number(filters.companyId) : undefined,
        employeeId: filters.employeeId ? Number(filters.employeeId) : undefined,
        pageSize: 100
      });
      setUsers(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado del usuario');
    }
  }

  async function exportCsv() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const items = await collectAllPages(
        (query) =>
          api.users.list(token, {
            search: filters.search || undefined,
            role: filters.role || undefined,
            active: filters.active || undefined,
            companyId: filters.companyId ? Number(filters.companyId) : undefined,
            employeeId: filters.employeeId ? Number(filters.employeeId) : undefined,
            ...query
          }),
        {
          search: filters.search || undefined,
          role: filters.role || undefined,
          active: filters.active || undefined
        }
      );
      const csv = buildCsv(
        ['Email', 'Identificador interno', 'Empresa', 'Roles', 'Empleado vinculado', 'Estado', 'Último acceso'],
        items.map((user) => [
          user.email,
          user.numero,
          user.companyName ?? 'Global',
          getRoleListLabel(user.roles),
          user.employeeName ?? '-',
          user.active ? 'Activo' : 'Inactivo',
          user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Sin acceso'
        ])
      );
      downloadCsv('usuarios.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar los usuarios');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Cuentas de acceso</span>
        <h1>Cargando usuarios...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Cuentas"
        title="Usuarios de acceso"
        description="El acceso solo usa correo y contraseña. El número, el DNI y el nombre visible son datos internos de la cuenta, no credenciales."
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{users.length}</strong>
              <span className="muted">Usuarios visibles</span>
            </article>
            <article className="stat stat--compact">
              <strong>{companies.length}</strong>
              <span className="muted">Empresas cargadas</span>
            </article>
            <article className="stat stat--compact">
              <strong>{getRoleListLabel(roles)}</strong>
              <span className="muted">Acceso actual</span>
            </article>
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Filtros de acceso</h2>
            <p className="meta">La empresa se limita por el rol autenticado.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input className="field" placeholder="Buscar..." value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} />
            <button className="button button-secondary" type="button" onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
            <button className="button" type="button" onClick={beginCreate}>
              Nuevo usuario
            </button>
          </div>
        </div>

        <div className="grid grid--3">
          <label className="stack">
            <span className="field-label">Rol</span>
            <select className="field" value={filters.role} onChange={(e) => setFilters((current) => ({ ...current, role: e.target.value }))}>
              <option value="">Todos</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {getRoleListLabel([role])}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span className="field-label">Estado</span>
            <select className="field" value={filters.active} onChange={(e) => setFilters((current) => ({ ...current, active: e.target.value }))}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
          {canManageGlobally ? (
            <label className="stack">
              <span className="field-label">Empresa</span>
              <select className="field" value={filters.companyId} onChange={(e) => setFilters((current) => ({ ...current, companyId: e.target.value }))}>
                <option value="">Todas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </section>

      <Modal
        open={editorOpen}
        onClose={closeEditor}
        size="xl"
        title={selectedUser ? 'Editar acceso' : 'Crear acceso'}
        description={selectedUser ? `Editando acceso de ${selectedUser.email}` : 'Define el correo, la contraseña inicial y los datos internos si aplican.'}
        actions={
          <>
            {selectedUser ? (
              <button className="button button-secondary" type="button" onClick={closeEditor}>
                Cancelar edición
              </button>
            ) : null}
            <button className="button button-primary" type="button" onClick={() => void saveUser()} disabled={saving}>
              {saving ? 'Guardando...' : selectedUser ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
          </>
        }
      >
        <div className="grid grid--2">
          <label className="stack">
            <span className="field-label">Email</span>
            <input className="field" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} />
          </label>
          <label className="stack">
            <span className="field-label">Identificador interno</span>
            <input className="field" value={form.numero} onChange={(e) => setForm((current) => ({ ...current, numero: e.target.value }))} />
          </label>
          <label className="stack">
            <span className="field-label">DNI interno</span>
            <input className="field" value={form.dni} onChange={(e) => setForm((current) => ({ ...current, dni: e.target.value }))} />
          </label>
          <label className="stack">
            <span className="field-label">Nombre visible</span>
            <input className="field" value={form.nombreEmpleado} onChange={(e) => setForm((current) => ({ ...current, nombreEmpleado: e.target.value }))} />
          </label>
          <label className="stack">
            <span className="field-label">Contraseña inicial {selectedUser ? '(opcional)' : ''}</span>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
            />
          </label>
          <label className="stack">
            <span className="field-label">Estado de la cuenta</span>
            <select className="field" value={String(form.active)} onChange={(e) => setForm((current) => ({ ...current, active: e.target.value === 'true' }))}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
          <label className="stack">
            <span className="field-label">Empresa</span>
            <select
              className="field"
              value={form.companyId}
              onChange={(e) => {
                const companyId = e.target.value;
                setForm((current) => ({ ...current, companyId, employeeId: '' }));
              }}
              disabled={!canManageGlobally}
            >
              <option value="">{canManageGlobally ? 'Selecciona una empresa' : 'Empresa del contexto'}</option>
              {(canManageGlobally ? companies : companies.slice(0, 1)).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span className="field-label">Empleado vinculado</span>
            <select className="field" value={form.employeeId} onChange={(e) => setForm((current) => ({ ...current, employeeId: e.target.value }))}>
              <option value="">Sin vínculo</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.numero} · {employee.nombreEmpleado}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="stack">
          <span className="field-label">Roles de acceso</span>
          <div className="chips-grid">
            {ROLE_OPTIONS.map((role) => {
              const checked = form.roles.includes(role);
              return (
                <label key={role} className={checked ? 'chip chip--selected' : 'chip'}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        roles: e.target.checked ? [...new Set([...current.roles, role])] : current.roles.filter((value) => value !== role)
                      }))
                    }
                  />
                  <span>{getRoleListLabel([role])}</span>
                </label>
              );
            })}
          </div>
        </div>
      </Modal>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado de accesos</h2>
            <p className="meta">Correo, empresa, roles y empleado vinculado.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Acceso</th>
                <th>Identificador interno</th>
                <th>Empresa</th>
                <th>Roles</th>
                <th>Empleado vinculado</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.numero}</td>
                  <td>{user.companyName ?? 'Global'}</td>
                  <td>{getRoleListLabel(user.roles)}</td>
                  <td>{user.employeeName ?? '-'}</td>
                  <td>{user.active ? 'Activo' : 'Inactivo'}</td>
                  <td>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Sin acceso'}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="button button-secondary" type="button" onClick={() => beginEdit(user)}>
                        Editar
                      </button>
                      <button className="button button-secondary" type="button" onClick={() => void setUserActive(user, !user.active)}>
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length ? (
                <tr>
                  <td colSpan={8} className="muted">
                    Sin accesos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
