export type RoleName = 'ROLE_ADMIN' | 'ROLE_RRHH' | 'ROLE_USER';

export type NavigationItem = {
  href: string;
  label: string;
  icon: 'home' | 'clock' | 'users' | 'calendar' | 'building' | 'briefcase' | 'shield' | 'user' | 'sparkles' | 'layout-grid';
  roles?: RoleName[];
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Inicio',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: 'home' },
      { href: '/time-entries', label: 'Mi jornada', icon: 'clock' },
      { href: '/my-calendar', label: 'Mi calendario', icon: 'calendar' }
    ]
  },
  {
    label: 'Personas',
    items: [
      { href: '/employees', label: 'Empleados', icon: 'users', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/users', label: 'Usuarios', icon: 'user', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] }
    ]
  },
  {
    label: 'Ausencias',
    items: [
      { href: '/vacations', label: 'Vacaciones', icon: 'calendar' },
      { href: '/permissions', label: 'Permisos', icon: 'shield' },
      { href: '/incidents', label: 'Incidencias', icon: 'briefcase' }
    ]
  },
  {
    label: 'Organización',
    items: [
      { href: '/calendars', label: 'Calendarios', icon: 'calendar', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/shifts', label: 'Turnos', icon: 'sparkles', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/schedule', label: 'Planificación', icon: 'layout-grid', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/companies', label: 'Empresas', icon: 'building', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] },
      { href: '/api-keys', label: 'Claves', icon: 'shield', roles: ['ROLE_ADMIN', 'ROLE_RRHH'] }
    ]
  }
];

export function canAccessNavigationItem(item: NavigationItem, roles: RoleName[]) {
  return !item.roles || item.roles.some((role) => roles.includes(role));
}

export function getNavigationTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Inicio';
  if (pathname.startsWith('/time-entries')) return 'Mi jornada';
  if (pathname.startsWith('/my-calendar')) return 'Mi calendario';
  if (pathname.startsWith('/employees')) return 'Empleados';
  if (pathname.startsWith('/users')) return 'Usuarios';
  if (pathname.startsWith('/vacations')) return 'Vacaciones';
  if (pathname.startsWith('/permissions')) return 'Permisos';
  if (pathname.startsWith('/incidents')) return 'Incidencias';
  if (pathname.startsWith('/calendars')) return 'Calendarios';
  if (pathname.startsWith('/shifts')) return 'Turnos';
  if (pathname.startsWith('/schedule')) return 'Planificación';
  if (pathname.startsWith('/companies')) return 'Empresas';
  if (pathname.startsWith('/api-keys')) return 'Claves';
  if (pathname.startsWith('/profile')) return 'Perfil';
  return 'Victrium RH';
}
