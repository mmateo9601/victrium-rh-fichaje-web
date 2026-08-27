'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Modal } from '../../components/modal';
import {
  api,
  type Company,
  type Employee,
  type WorkLocation,
  type RoleName
} from '../../lib/api/generated';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';
import { getRoleLabel, getRoleListLabel } from '../../lib/labels';

const baseRoleOptions: RoleName[] = ['ROLE_USER', 'ROLE_RRHH', 'ROLE_COMPANY_ADMIN', 'ROLE_MANAGER', 'ROLE_SUPER_ADMIN'];

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [createCompanyId, setCreateCompanyId] = useState('');
  const [createNumero, setCreateNumero] = useState('');
  const [createNombre, setCreateNombre] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createDni, setCreateDni] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPrimaryWorkLocationId, setCreatePrimaryWorkLocationId] = useState('');
  const [createRoles, setCreateRoles] = useState<RoleName[]>(['ROLE_USER']);
  const [createWorking, setCreateWorking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState(() => getStoredSession());
  const [sessionReady, setSessionReady] = useState(false);
  const roles = getEffectiveRoles(session);
  const canManage = roles.some((role) => role === 'ROLE_COMPANY_ADMIN' || role === 'ROLE_RRHH' || role === 'ROLE_SUPER_ADMIN');
  const accessDenied = Boolean(session) && !canManage;
  const roleOptions = useMemo(
    () =>
      roles.includes('ROLE_SUPER_ADMIN')
        ? baseRoleOptions
        : baseRoleOptions.filter((role) => role !== 'ROLE_SUPER_ADMIN'),
    [roles]
  );

  useEffect(() => {
    setCreateRoles((current) => {
      const next = current.filter((role) => roleOptions.includes(role));
      return next.length ? next : ['ROLE_USER'];
    });
  }, [roleOptions]);

  useEffect(() => {
    setSession(getStoredSession());
    setSessionReady(true);
  }, []);

  if (accessDenied) {
    return null;
  }

  const selectedCompanyId = useMemo(
    () => (createCompanyId ? Number(createCompanyId) : session?.user.companyId ?? null),
    [createCompanyId, session?.user.companyId]
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !sessionReady || !selectedCompanyId) {
      setWorkLocations([]);
      setCreatePrimaryWorkLocationId('');
      return;
    }
    const authToken = token;

    let cancelled = false;

    async function loadWorkLocations() {
      try {
        const response = await api.workLocations.list(authToken, {
          pageSize: 100,
          companyId: selectedCompanyId ?? undefined,
          active: 'true'
        });
        if (!cancelled) {
          setWorkLocations(response.data);
          setCreatePrimaryWorkLocationId((current) =>
            response.data.some((location) => String(location.id) === current) ? current : ''
          );
        }
      } catch {
        if (!cancelled) {
          setWorkLocations([]);
        }
      }
    }

    void loadWorkLocations();

    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId, sessionReady]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!sessionReady) {
      return;
    }
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!canManage) {
      router.replace('/dashboard');
      return;
    }
    const authToken = token;

    async function load() {
      try {
        const [employeesResult, companiesResult] = await Promise.all([
          api.employees.list(authToken, {
            search,
            companyId: companyFilter ? Number(companyFilter) : undefined,
            page: pagination.page,
            pageSize: pagination.pageSize
          }),
          api.companies.list(authToken, { pageSize: 50 })
        ]);
        setEmployees(employeesResult.data);
        setPagination(employeesResult.pagination);
        setCompanies(companiesResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar Employees');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, search, companyFilter, pagination.page, pagination.pageSize, canManage, session, sessionReady]);

  async function createEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    setCreateLoading(true);
    setError(null);
    try {
      await api.employees.create(authToken, {
        companyId: createCompanyId ? Number(createCompanyId) : undefined,
        primaryWorkLocationId: createPrimaryWorkLocationId ? Number(createPrimaryWorkLocationId) : undefined,
        numero: createNumero,
        nombreEmpleado: createNombre,
        email: createEmail,
        dni: createDni,
        password: createPassword,
        roles: createRoles,
        working: createWorking
      });
      const refreshed = await api.employees.list(authToken, {
        search,
        companyId: companyFilter ? Number(companyFilter) : undefined,
        page: 1,
        pageSize: pagination.pageSize
      });
      setEmployees(refreshed.data);
      setPagination(refreshed.pagination);
      setCreateNumero('');
      setCreateNombre('');
      setCreateEmail('');
      setCreateDni('');
      setCreatePassword('');
      setCreatePrimaryWorkLocationId('');
      setCreateRoles(['ROLE_USER']);
      setCreateWorking(false);
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el empleado');
    } finally {
      setCreateLoading(false);
    }
  }

  function toggleRole(role: RoleName) {
    setCreateRoles((current) =>
      current.includes(role) ? current.filter((value) => value !== role) : [...current, role]
    );
  }

  async function exportCsv() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    setExporting(true);
    setError(null);
    try {
      const items = await collectAllPages(
        (query) => api.employees.list(authToken, { search, companyId: companyFilter ? Number(companyFilter) : undefined, ...query }),
        { search, companyId: companyFilter ? Number(companyFilter) : undefined }
      );
      const csv = buildCsv(
        ['Número', 'Nombre', 'Email', 'DNI', 'Empresa', 'Estado', 'Roles', 'Working'],
        items.map((employee) => [
          employee.numero,
          employee.nombreEmpleado,
          employee.email,
          employee.dni,
          employee.companyName ?? 'Global',
          employee.active ? 'Activo' : 'Inactivo',
          getRoleListLabel(employee.roles),
          employee.working === null ? '' : employee.working ? 'Sí' : 'No'
        ])
      );
      downloadCsv('empleados.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar los empleados');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Empleados</span>
        <h1>Cargando empleados...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Personas</span>
        <h1>Empleados</h1>
        <p>
          Listado, alta, detalle y activación o desactivación de empleados con alcance por empresa.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        {canManage ? (
          <div className="hero-actions" style={{ marginTop: '1.5rem' }}>
            <button className="button button-primary" type="button" onClick={() => setCreateOpen(true)}>
              Nuevo empleado
            </button>
          </div>
        ) : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{pagination.total}</strong>
            <span className="muted">Registros visibles</span>
          </article>
          <article className="stat">
            <strong>{session?.user.companyId ?? 'Global'}</strong>
            <span className="muted">Empresa activa</span>
          </article>
          <article className="stat">
            <strong>{getRoleListLabel(roles)}</strong>
            <span className="muted">Acceso actual</span>
          </article>
        </div>
      </section>

      {canManage ? (
        <Modal
          open={createOpen}
          title="Crear empleado"
          description="Da de alta un empleado, vincúlalo a una empresa y asigna roles de acceso."
          size="xl"
          onClose={() => setCreateOpen(false)}
          actions={
            <>
              <button className="button button-secondary" type="button" onClick={() => setCreateOpen(false)}>
                Cancelar
              </button>
              <button className="button button-primary" type="submit" form="employee-create-form" disabled={createLoading}>
                {createLoading ? 'Creando...' : 'Crear empleado'}
              </button>
            </>
          }
        >
        <form id="employee-create-form" className="stack" onSubmit={createEmployee}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="companyId">Empresa</label>
              <select
                id="companyId"
                value={createCompanyId}
                onChange={(event) => {
                  setCreateCompanyId(event.target.value);
                  setCreatePrimaryWorkLocationId('');
                }}
              >
                <option value="">Empresa asignada</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="primaryWorkLocationId">Centro habitual</label>
              <select
                id="primaryWorkLocationId"
                value={createPrimaryWorkLocationId}
                onChange={(event) => setCreatePrimaryWorkLocationId(event.target.value)}
                disabled={!selectedCompanyId}
              >
                <option value="">Selecciona un centro</option>
                {workLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} · {location.city ?? location.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="numero">Número</label>
              <input id="numero" value={createNumero} onChange={(e) => setCreateNumero(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" value={createNombre} onChange={(e) => setCreateNombre(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="dni">DNI</label>
              <input id="dni" value={createDni} onChange={(e) => setCreateDni(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="working">Activo</label>
              <select id="working" value={String(createWorking)} onChange={(e) => setCreateWorking(e.target.value === 'true')}>
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Roles</label>
            <div className="grid-auto">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`button ${createRoles.includes(role) ? 'button-primary' : 'button-secondary'}`}
                  onClick={() => toggleRole(role)}
                >
                  {getRoleLabel([role])}
              </button>
            ))}
          </div>
        </div>
        </form>
        </Modal>
      ) : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Paginación server-side con búsqueda en backend.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input
              className="field"
              style={{ minWidth: '240px' }}
              placeholder="Buscar empleado..."
              value={search}
              onChange={(e) => {
                setPagination((current) => ({ ...current, page: 1 }));
                setSearch(e.target.value);
              }}
            />
            {roles.includes('ROLE_SUPER_ADMIN') ? (
              <select
                className="field"
                style={{ minWidth: '220px' }}
                value={companyFilter}
                onChange={(e) => {
                  setPagination((current) => ({ ...current, page: 1 }));
                  setCompanyFilter(e.target.value);
                }}
              >
                <option value="">Todas las empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            ) : null}
            <button className="button button-secondary" type="button" onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.numero}</td>
                  <td>{employee.nombreEmpleado}</td>
                  <td>{employee.email}</td>
                  <td>{employee.companyName ?? 'Global'}</td>
                  <td>
                    <span className={`badge ${employee.active ? 'badge-success' : 'badge-danger'}`}>
                      {employee.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <Link className="button button-secondary" href={`/employees/${employee.id}`}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {!employees.length ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Sin resultados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="hero-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
          >
            Anterior
          </button>
          <span className="meta">
            Página {pagination.page} de {pagination.totalPages || 1}
          </span>
          <button
            className="button button-secondary"
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            Siguiente
          </button>
        </div>
      </section>
    </div>
  );
}
