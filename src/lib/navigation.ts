export type RoleName = 'ROLE_ADMIN' | 'ROLE_RRHH' | 'ROLE_USER';

export type NavigationItem = {
  href: string;
  label: string;
  description: string;
  roles?: RoleName[];
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'General',
    items: [
      { href: '/dashboard', label: 'Dashboard', description: 'Resumen operativo de la jornada y la actividad.' },
      { href: '/time-entries', label: 'Fichajes', description: 'Control horario, detalle y correcciones.' }
    ]
  },
  {
    label: 'Personas',
    items: [
      { href: '/employees', label: 'Empleados', description: 'Directorio laboral, estado y detalle.', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/users', label: 'Usuarios', description: 'Identidades, roles y acceso.', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/profile', label: 'Perfil', description: 'Tus datos y cambio de contraseña.' }
    ]
  },
  {
    label: 'Ausencias',
    items: [
      { href: '/vacations', label: 'Vacaciones', description: 'Solicitudes, aprobación y seguimiento.' },
      { href: '/permissions', label: 'Permisos', description: 'Permisos laborales y resolución.' },
      { href: '/incidents', label: 'Incidencias', description: 'Registro, seguimiento y cierre.' }
    ]
  },
  {
    label: 'Organización',
    items: [
      { href: '/calendars', label: 'Calendarios', description: 'Horario laboral y días especiales.', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/companies', label: 'Empresas', description: 'Tenant y compañías del sistema.', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/api-keys', label: 'API Keys', description: 'Claves de integración externas.', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] }
    ]
  }
];

export function canAccessNavigationItem(item: NavigationItem, roles: RoleName[]) {
  return !item.roles || item.roles.some((role) => roles.includes(role));
}

export function getNavigationTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/time-entries')) return 'Fichajes';
  if (pathname.startsWith('/employees')) return 'Empleados';
  if (pathname.startsWith('/users')) return 'Usuarios';
  if (pathname.startsWith('/vacations')) return 'Vacaciones';
  if (pathname.startsWith('/permissions')) return 'Permisos';
  if (pathname.startsWith('/incidents')) return 'Incidencias';
  if (pathname.startsWith('/calendars')) return 'Calendarios';
  if (pathname.startsWith('/companies')) return 'Empresas';
  if (pathname.startsWith('/api-keys')) return 'API Keys';
  if (pathname.startsWith('/profile')) return 'Perfil';
  return 'Victrium RH';
}
