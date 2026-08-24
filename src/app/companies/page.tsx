'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type Company } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timezoneOptions = getTimezoneOptions();

  const session = useMemo(() => getStoredSession(), []);
  const canManage =
    session?.user.roles.some(
      (role) => role === 'ROLE_COMPANY_ADMIN' || role === 'ROLE_SUPER_ADMIN'
    ) ?? false;

  function beginEdit(company: Company) {
    setSelectedCompany(company);
    setName(company.name);
    setCode(company.code);
    setTimezone(company.timezone ?? '');
    setActive(company.active);
  }

  function clearEdit() {
    setSelectedCompany(null);
    setName('');
    setCode('');
    setTimezone('');
    setActive(true);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!canManage) {
      router.replace('/forbidden');
      return;
    }
    const authToken = token;

    async function load() {
      try {
        const [companyList, mine] = await Promise.all([
          api.companies.list(authToken, { search: search || undefined, pageSize: 50 }),
          api.companies.mine(authToken)
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
      await api.companies.create(authToken, { name, code, timezone: timezone || null, active });
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
        active
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
      <section className="hero">
        <span className="eyebrow">Organización</span>
        <h1>Empresas</h1>
        <p>Gestiona las empresas disponibles y su información básica para la organización.</p>
        {companyMe ? (
          <div className="notice">
            Empresa actual: {companyMe.name} ({companyMe.code})
            <div style={{ marginTop: '0.75rem' }}>
              <Link className="button button-secondary" href={`/companies/${companyMe.id}`}>
                Ajustes de empresa
              </Link>
            </div>
          </div>
        ) : null}
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>

      {canManage ? (
        <form className="panel stack" onSubmit={onCreate}>
          <h2 className="section-title">Crear empresa</h2>
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
          </div>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear empresa'}
          </button>
        </form>
      ) : null}

      {canManage && selectedCompany ? (
        <form className="panel stack" onSubmit={onUpdate}>
          <div className="toolbar">
            <div>
              <h2 className="section-title">Editar empresa</h2>
              <p className="meta">Actualiza los datos base de la empresa seleccionada.</p>
            </div>
            <button className="button button-secondary" type="button" onClick={clearEdit}>
              Cancelar
            </button>
          </div>
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
          </div>
          <button className="button button-primary" type="submit" disabled={updating}>
            {updating ? 'Actualizando...' : 'Guardar cambios'}
          </button>
        </form>
      ) : null}

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
