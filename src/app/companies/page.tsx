'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '../../components/page-header';
import { Modal } from '../../components/modal';
import { api, type Company } from '../../lib/api/generated';
import { getAccessToken, getEffectiveRoles, getStoredSession } from '../../lib/auth/session';
import { buildCsv, collectAllPages, downloadCsv } from '../../lib/csv';
import { getTimezoneOptions } from '../../lib/timezones';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyMe, setCompanyMe] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [timezone, setTimezone] = useState('');
  const [active, setActive] = useState(true);
  const [allowOvertime, setAllowOvertime] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timezoneOptions = getTimezoneOptions();

  const session = useMemo(() => getStoredSession(), []);
  const roles = useMemo(() => getEffectiveRoles(session), [session]);
  const canManage = roles.some((role) => role === 'ROLE_COMPANY_ADMIN' || role === 'ROLE_SUPER_ADMIN');
  const canCreateCompany = roles.includes('ROLE_SUPER_ADMIN');
  const accessDenied = Boolean(session) && !canManage;

  function beginEdit(company: Company) {
    setSelectedCompany(company);
    setName(company.name);
    setCode(company.code);
    setTimezone(company.timezone ?? '');
    setActive(company.active);
    setAllowOvertime((company.workPolicy as Record<string, unknown> | null | undefined)?.allowOvertime !== false);
    setEditOpen(true);
  }

  function clearEdit() {
    setSelectedCompany(null);
    setName('');
    setCode('');
    setTimezone('');
    setActive(true);
    setAllowOvertime(true);
    setEditOpen(false);
  }

  function beginCreate() {
    setSelectedCompany(null);
    setName('');
    setCode('');
    setTimezone('');
    setActive(true);
    setAllowOvertime(true);
    setCreateOpen(true);
  }

  function clearCreate() {
    setName('');
    setCode('');
    setTimezone('');
    setActive(true);
    setAllowOvertime(true);
    setCreateOpen(false);
  }

  if (accessDenied) {
    return null;
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
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
        const [companyList, mine] = await Promise.all([
          api.companies.list(authToken, { search: search || undefined, pageSize: 50 }),
          api.companies.mine(authToken).catch(() => null)
        ]);
        setCompanies(companyList.data);
        setCompanyMe(mine);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar Companies');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, search, canManage]);

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
        (query) => api.companies.list(token, { search: search || undefined, ...query }),
        { search: search || undefined }
      );
      const csv = buildCsv(
        ['Nombre', 'Código', 'Estado'],
        items.map((company) => [company.name, company.code, company.active ? 'Activa' : 'Inactiva'])
      );
      downloadCsv('empresas.csv', csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar las empresas');
    } finally {
      setExporting(false);
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken = token;

    setSaving(true);
    setError(null);
    try {
      await api.companies.create(authToken, {
        name,
        code,
        timezone: timezone || null,
        active,
        workPolicy: { allowOvertime }
      });
      setName('');
      setCode('');
      setTimezone('');
      setActive(true);
      const refreshed = await api.companies.list(authToken, { search: search || undefined, pageSize: 50 });
      setCompanies(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la empresa');
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token || !selectedCompany) {
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      await api.companies.update(token, selectedCompany.id, {
        name,
        code,
        timezone: timezone || null,
        active,
        workPolicy: { allowOvertime }
      });
      const refreshed = await api.companies.list(token, { search: search || undefined, pageSize: 50 });
      setCompanies(refreshed.data);
      clearEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la empresa');
    } finally {
      setUpdating(false);
    }
  }

  async function toggleCompanyActive(company: Company) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setTogglingId(company.id);
    setError(null);
    try {
      await api.companies.update(token, company.id, {
        name: company.name,
        code: company.code,
        timezone: company.timezone ?? null,
        active: !company.active,
        workPolicy: company.workPolicy ?? null
      });
      const refreshed = await api.companies.list(token, { search: search || undefined, pageSize: 50 });
      setCompanies(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado de la empresa');
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteCompany(company: Company) {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!window.confirm(`¿Eliminar la empresa ${company.name}? Esta acción solo se permite si no tiene dependencias.`)) {
      return;
    }

    setTogglingId(company.id);
    setError(null);
    try {
      await api.companies.delete(token, company.id);
      const refreshed = await api.companies.list(token, { search: search || undefined, pageSize: 50 });
      setCompanies(refreshed.data);
      if (selectedCompany?.id === company.id) {
        clearEdit();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la empresa');
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Empresas</span>
        <h1>Cargando empresas...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Organización"
        title="Empresas"
        description="Gestiona las empresas disponibles y su información básica para la organización."
        actions={
          <div className="hero-actions" style={{ marginTop: 0 }}>
            {companyMe ? <Link className="button button-secondary" href={`/companies/${companyMe.id}`}>Ajustes de empresa</Link> : null}
            {canCreateCompany ? (
              <button className="button button-primary" type="button" onClick={beginCreate}>
                Nueva empresa
              </button>
            ) : null}
          </div>
        }
        stats={
          <>
            <article className="stat stat--compact">
              <strong>{companies.length}</strong>
              <span className="muted">Empresas visibles</span>
            </article>
            {companyMe ? (
              <article className="stat stat--compact">
                <strong>{companyMe.code}</strong>
                <span className="muted">Empresa actual</span>
              </article>
            ) : null}
          </>
        }
      />

      {error ? <div className="notice notice--error" role="alert">{error}</div> : null}

      <Modal
        open={createOpen && canCreateCompany}
        onClose={clearCreate}
        size="lg"
        title="Nueva empresa"
        description="Crea una empresa con su zona horaria y política operativa."
        actions={
          <button className="button button-primary" type="submit" form="company-create-form" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear empresa'}
          </button>
        }
      >
        <form id="company-create-form" className="stack" onSubmit={onCreate}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="company-name">Nombre</label>
              <input id="company-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="company-code">Código</label>
              <input id="company-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="company-timezone">Zona horaria</label>
              <select id="company-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="">Selecciona una zona horaria</option>
                {timezoneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="company-active">Estado</label>
              <select id="company-active" value={String(active)} onChange={(e) => setActive(e.target.value === 'true')}>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="company-allow-overtime">Horas extra</label>
              <select id="company-allow-overtime" value={String(allowOvertime)} onChange={(e) => setAllowOvertime(e.target.value === 'true')}>
                <option value="true">Permitidas</option>
                <option value="false">No permitidas</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen && canManage && Boolean(selectedCompany)}
        onClose={clearEdit}
        size="lg"
        title="Editar empresa"
        description="Actualiza los datos base de la empresa seleccionada."
        actions={
          <button className="button button-primary" type="submit" form="company-edit-form" disabled={updating}>
            {updating ? 'Actualizando...' : 'Guardar cambios'}
          </button>
        }
      >
        <form id="company-edit-form" className="stack" onSubmit={onUpdate}>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="edit-company-name">Nombre</label>
              <input id="edit-company-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="edit-company-code">Código</label>
              <input id="edit-company-code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="edit-company-timezone">Zona horaria</label>
              <select id="edit-company-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="">Selecciona una zona horaria</option>
                {timezoneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-company-active">Estado</label>
              <select id="edit-company-active" value={String(active)} onChange={(e) => setActive(e.target.value === 'true')}>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-company-allow-overtime">Horas extra</label>
              <select
                id="edit-company-allow-overtime"
                value={String(allowOvertime)}
                onChange={(e) => setAllowOvertime(e.target.value === 'true')}
              >
                <option value="true">Permitidas</option>
                <option value="false">No permitidas</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <section className="panel stack">
          <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Solo muestra lo permitido por tus permisos actuales.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input
              className="field"
              style={{ minWidth: '220px' }}
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="button button-secondary" type="button" onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Estado</th>
                {canManage ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.code}</td>
                  <td>
                    <span className={`badge ${company.active ? 'badge-success' : 'badge-danger'}`}>
                      {company.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  {canManage ? (
                    <td>
                      <div className="hero-actions" style={{ marginTop: 0 }}>
                        <button className="button button-secondary" type="button" onClick={() => beginEdit(company)}>
                          Editar
                        </button>
                        <Link className="button button-primary" href={`/companies/${company.id}`}>
                          Ajustes
                        </Link>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => void toggleCompanyActive(company)}
                          disabled={togglingId === company.id}
                        >
                          {company.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => void deleteCompany(company)}
                          disabled={togglingId === company.id}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {!companies.length ? (
                <tr>
                  <td colSpan={canManage ? 4 : 3} className="muted">
                    Sin resultados.
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
