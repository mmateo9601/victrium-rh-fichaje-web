'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { ScheduleGrid } from '../../../components/schedule-grid';
import { api, type Company, type Employee, type EmployeeLocationAssignment, type Schedule, type ShiftAssignment } from '../../../lib/api/generated';
import { getAccessToken } from '../../../lib/auth/session';
import { getRoleListLabel } from '../../../lib/labels';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [locationAssignments, setLocationAssignments] = useState<EmployeeLocationAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monthRange = useMemo(() => {
    const today = new Date();
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    async function load() {
      try {
        const [detail, companyList] = await Promise.all([
          api.employees.byId(authToken, id),
          api.companies.list(authToken, { pageSize: 50 })
        ]);
        setEmployee(detail);
        setCompanies(companyList.data);
        const [scheduleResult, assignmentsResult] = await Promise.all([
          api.schedule.employee(authToken, id, monthRange),
          api.schedule.employeeAssignments(authToken, id)
        ]);
        setSchedule(scheduleResult);
        setAssignments(assignmentsResult);
        const locationAssignmentsResult = await api.workLocations.assignments(authToken, { employeeId: id, pageSize: 50, sort: 'validFrom', order: 'desc' });
        setLocationAssignments(locationAssignmentsResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el detalle');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id, router, monthRange]);

  async function save() {
    const token = getAccessToken();
    if (!token || !employee) {
      return;
    }
    const authToken = token;

    setSaving(true);
    setError(null);
    try {
      const updated = await api.employees.update(authToken, employee.id, {
        companyId: employee.companyId ?? undefined,
        numero: employee.numero,
        nombreEmpleado: employee.nombreEmpleado,
        email: employee.email,
        dni: employee.dni,
        working: employee.working ?? undefined,
        enVacaciones: employee.enVacaciones ?? undefined,
        deBaja: employee.deBaja ?? undefined,
        diasVacaciones: employee.diasVacaciones ?? undefined,
        horasGeneradas: employee.horasGeneradas ?? undefined
      });
      setEmployee(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el empleado');
    } finally {
      setSaving(false);
    }
  }

  async function setActive(active: boolean) {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    const authToken = token;

    try {
      const updated = active
        ? await api.employees.activate(authToken, id)
        : await api.employees.deactivate(authToken, id);
      setEmployee(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Empleados</span>
        <h1>Cargando detalle...</h1>
      </section>
    );
  }

  if (!employee) {
    return (
      <section className="hero">
        <span className="eyebrow">Empleados</span>
        <h1>Empleado no encontrado</h1>
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Detalle</span>
        <h1>{employee.nombreEmpleado}</h1>
        <p>
          Edita los datos laborales y cambia el estado activo/inactivo sin perder el vínculo con su
          usuario ni con la empresa.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{employee.numero}</strong>
            <span className="muted">Número</span>
          </article>
          <article className="stat">
            <strong>{employee.companyName ?? 'Global'}</strong>
            <span className="muted">Empresa</span>
          </article>
          <article className="stat">
            <strong>{getRoleListLabel(employee.roles)}</strong>
            <span className="muted">Roles</span>
          </article>
        </div>
      </section>

      <section className="two-col">
        <form className="panel stack" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <h2 className="section-title">Editar empleado</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="numero">Número</label>
              <input id="numero" value={employee.numero} onChange={(e) => setEmployee({ ...employee, numero: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                value={employee.nombreEmpleado}
                onChange={(e) => setEmployee({ ...employee, nombreEmpleado: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" value={employee.email} onChange={(e) => setEmployee({ ...employee, email: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="dni">DNI</label>
              <input id="dni" value={employee.dni} onChange={(e) => setEmployee({ ...employee, dni: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="companyId">Empresa</label>
              <select
                id="companyId"
                value={employee.companyId ?? ''}
                onChange={(e) =>
                  setEmployee({
                    ...employee,
                    companyId: e.target.value ? Number(e.target.value) : null,
                    companyName: e.target.value ? companies.find((company) => company.id === Number(e.target.value))?.name ?? null : null
                  })
                }
              >
                <option value="">Sin empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="working">Activo</label>
              <select
                id="working"
                value={String(Boolean(employee.working))}
                onChange={(e) => setEmployee({ ...employee, working: e.target.value === 'true' })}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="deBaja">De baja</label>
              <select
                id="deBaja"
                value={String(Boolean(employee.deBaja))}
                onChange={(e) => setEmployee({ ...employee, deBaja: e.target.value === 'true' })}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="vacaciones">De vacaciones</label>
              <select
                id="vacaciones"
                value={String(Boolean(employee.enVacaciones))}
                onChange={(e) => setEmployee({ ...employee, enVacaciones: e.target.value === 'true' })}
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>

          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        <aside className="panel stack">
          <h2 className="section-title">Acciones</h2>
          <div className="stack">
            <button className="button button-secondary" type="button" onClick={() => router.push('/employees')}>
              Volver al listado
            </button>
            <button className="button button-primary" type="button" onClick={() => setActive(true)}>
              Activar
            </button>
            <button className="button button-danger" type="button" onClick={() => setActive(false)}>
              Desactivar
            </button>
          </div>
          <div className="notice">
            <strong>Estado actual</strong>
            <div className="meta">{employee.active ? 'Activo' : 'Inactivo'}</div>
          </div>
          <div className="notice">
            <strong>Usuario vinculado</strong>
            <div className="meta">{employee.userId ?? 'Sin usuario'}</div>
          </div>
        </aside>
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Horario y turnos</h2>
            <p className="meta">Vigencia actual, histórico y planificación del mes en curso.</p>
          </div>
          <button className="button button-secondary" type="button" onClick={() => router.push(`/employees/${employee.id}/schedule`)}>
            Abrir calendario
          </button>
        </div>

        {assignments.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Turno</th>
                  <th>Vigencia</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.shift.name}</td>
                    <td>
                      {assignment.validFrom} {assignment.validTo ? `- ${assignment.validTo}` : '(vigente)'}
                    </td>
                    <td>{assignment.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <strong>Sin turnos asignados</strong>
            <p className="meta">Todavía no hay una planificación histórica asociada a este empleado.</p>
          </div>
        )}

        {schedule ? <ScheduleGrid schedule={schedule} compact /> : null}
      </section>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Historial de centros</h2>
            <p className="meta">Movilidad del empleado entre ubicaciones de trabajo.</p>
          </div>
        </div>
        {locationAssignments.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Centro</th>
                  <th>Vigencia</th>
                  <th>Principal</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {locationAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <Link className="button button-ghost" href={`/work-locations/${assignment.workLocationId}`}>
                        {assignment.workLocationName}
                      </Link>
                    </td>
                    <td>
                      {assignment.validFrom} {assignment.validTo ? `- ${assignment.validTo}` : '(vigente)'}
                    </td>
                    <td>{assignment.primary ? 'Sí' : 'No'}</td>
                    <td>{assignment.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <strong>Sin historial de centros</strong>
            <p className="meta">Este empleado todavía no tiene asignaciones de ubicación registradas.</p>
          </div>
        )}
      </section>
    </div>
  );
}
