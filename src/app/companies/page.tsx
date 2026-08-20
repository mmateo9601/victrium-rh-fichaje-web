'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api, type Company } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyMe, setCompanyMe] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = useMemo(() => getStoredSession(), []);
  const isAdmin = session?.user.roles.includes('ROLE_ADMIN') ?? false;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
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
  }, [router, search]);

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
      await api.companies.create(authToken, { name, code });
      setName('');
      setCode('');
      const refreshed = await api.companies.list(authToken, { search: search || undefined, pageSize: 50 });
      setCompanies(refreshed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la empresa');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Companies</span>
        <h1>Cargando empresas...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Tenant</span>
        <h1>Companies</h1>
        <p>La empresa activa viaja en el token. La API decide qué tenant puedes ver o modificar.</p>
        {companyMe ? (
          <div className="notice">Empresa actual: {companyMe.name} ({companyMe.code})</div>
        ) : null}
        {error ? <div className="notice" role="alert">{error}</div> : null}
      </section>

      {isAdmin ? (
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
          </div>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear empresa'}
          </button>
        </form>
      ) : null}

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Listado</h2>
            <p className="meta">Sólo muestra lo permitido por la política de tenant.</p>
          </div>
          <input
            className="field"
            style={{ minWidth: '220px' }}
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Estado</th>
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
                </tr>
              ))}
              {!companies.length ? (
                <tr>
                  <td colSpan={3} className="muted">
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
