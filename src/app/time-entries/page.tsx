'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { api, type TimeEntry } from '../../lib/api/generated';
import { getAccessToken, getStoredSession } from '../../lib/auth/session';

const typeColors: Record<TimeEntry['tipo'], string> = {
  ENTRADA: 'badge-success',
  SALIDA: 'badge-warning'
};

export default function TimeEntriesPage() {
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const canManage = session?.user.roles.includes('ROLE_ADMIN') || session?.user.roles.includes('ROLE_RRHH');

  const [mine, setMine] = useState<TimeEntry[]>([]);
  const [all, setAll] = useState<TimeEntry[]>([]);
  const [search, setSearch] = useState('');
  const [numeroUsuario, setNumeroUsuario] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [tipo, setTipo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [clocking, setClocking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    async function load() {
      try {
        const mineResult = await api.timeEntries.mine(authToken, { search, tipo, from, to, pageSize: 15, order: 'desc' as const });
        setMine(mineResult.data);

        if (canManage) {
          const allResult = await api.timeEntries.list(authToken, {
            search,
            numeroUsuario,
            nombreUsuario,
            tipo,
            from,
            to,
            pageSize: 15,
            order: 'desc' as const
          });
          setAll(allResult.data);
        } else {
          setAll([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar Fichajes');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router, canManage, search, numeroUsuario, nombreUsuario, tipo, from, to]);

  async function refresh() {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const authToken: string = token;

    const mineResult = await api.timeEntries.mine(authToken, { search, tipo, from, to, pageSize: 15, order: 'desc' as const });
    setMine(mineResult.data);
    if (canManage) {
      const allResult = await api.timeEntries.list(authToken, {
        search,
        numeroUsuario,
        nombreUsuario,
        tipo,
        from,
        to,
        pageSize: 15,
        order: 'desc' as const
      });
      setAll(allResult.data);
    }
  }

  async function clock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setClocking(true);
    setError(null);
    try {
      await api.timeEntries.clock(token, { origen: 'web' });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el fichaje');
    } finally {
      setClocking(false);
    }
  }

  if (loading) {
    return (
      <section className="hero">
        <span className="eyebrow">Fichajes</span>
        <h1>Cargando fichajes...</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="hero">
        <span className="eyebrow">Control horario</span>
        <h1>Fichajes</h1>
        <p>
          Alterna entrada y salida con un clic y revisa tu histórico. Si tienes rol de gestión, también
          puedes consultar el listado completo de la empresa.
        </p>
        {error ? <div className="notice" role="alert">{error}</div> : null}
        <div className="grid-3" style={{ marginTop: '1.5rem' }}>
          <article className="stat">
            <strong>{mine.length}</strong>
            <span className="muted">Mis fichajes visibles</span>
          </article>
          <article className="stat">
            <strong>{session?.user.employeeId ?? 'Sin empleado'}</strong>
            <span className="muted">Employee del token</span>
          </article>
          <article className="stat">
            <strong>{session?.user.roles.join(', ') || 'Sin rol'}</strong>
            <span className="muted">Permisos de sesión</span>
          </article>
        </div>
      </section>

      <form className="panel stack" onSubmit={clock}>
        <h2 className="section-title">Registrar fichaje</h2>
        <p className="meta">La API alterna automáticamente entre entrada y salida según tu estado actual.</p>
        <button className="button button-primary" type="submit" disabled={clocking}>
          {clocking ? 'Registrando...' : 'Marcar entrada / salida'}
        </button>
      </form>

      <section className="panel stack">
        <div className="toolbar">
          <div>
            <h2 className="section-title">Mis fichajes</h2>
            <p className="meta">Listado filtrado por fecha, tipo y búsqueda global.</p>
          </div>
          <div className="hero-actions" style={{ marginTop: 0 }}>
            <input
              className="field"
              style={{ minWidth: '220px' }}
              placeholder="Buscar..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="field" style={{ minWidth: '140px' }} value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
            <input className="field" style={{ minWidth: '140px' }} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <input className="field" style={{ minWidth: '140px' }} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Día</th>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Origen</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.id}</td>
                    <td>{entry.dia}</td>
                    <td>{entry.hora}</td>
                    <td>
                      <span className={`badge ${typeColors[entry.tipo]}`}>{entry.tipo}</span>
                    </td>
                    <td>{entry.origen}</td>
                    <td>
                      <Link className="button button-secondary" href={`/time-entries/${entry.id}`}>
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {!mine.length ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      Sin resultados.
                    </td>
                  </tr>
                ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {canManage ? (
        <section className="panel stack">
          <div className="toolbar">
            <div>
              <h2 className="section-title">Listado general</h2>
              <p className="meta">Visible para RRHH y administración.</p>
            </div>
            <div className="hero-actions" style={{ marginTop: 0 }}>
              <input
                className="field"
                style={{ minWidth: '220px' }}
                placeholder="Número empleado"
                value={numeroUsuario}
                onChange={(event) => setNumeroUsuario(event.target.value)}
              />
              <input
                className="field"
                style={{ minWidth: '220px' }}
                placeholder="Nombre empleado"
                value={nombreUsuario}
                onChange={(event) => setNombreUsuario(event.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Día</th>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Empleado</th>
                  <th>Número</th>
                  <th>Empresa</th>
                  <th>Origen</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {all.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.id}</td>
                    <td>{entry.dia}</td>
                    <td>{entry.hora}</td>
                    <td>
                      <span className={`badge ${typeColors[entry.tipo]}`}>{entry.tipo}</span>
                    </td>
                    <td>{entry.usuarioNombre}</td>
                    <td>{entry.usuarioNumero}</td>
                    <td>{entry.companyName ?? 'Global'}</td>
                    <td>{entry.origen}</td>
                    <td>
                      <Link className="button button-secondary" href={`/time-entries/${entry.id}`}>
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {!all.length ? (
                  <tr>
                    <td colSpan={9} className="muted">
                      Sin fichajes para gestionar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
