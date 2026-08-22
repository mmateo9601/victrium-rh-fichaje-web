export type RoleName = 'ROLE_SUPER_ADMIN' | 'ROLE_ADMIN' | 'ROLE_COMPANY_ADMIN' | 'ROLE_RRHH' | 'ROLE_USER';

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
      { href: '/employees', label: 'Empleados', icon: 'users', roles: ['ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH'] },
      { href: '/users', label: 'Usuarios', icon: 'user', roles: ['ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] }
    ]
  },
  {
    label: 'Ausencias',
    items: [
      { href: '/vacations', label: 'Vacaciones', icon: 'calendar', roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/permissions', label: 'Permisos', icon: 'shield', roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/incidents', label: 'Incidencias', icon: 'briefcase', roles: ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] }
    ]
  },
  {
    label: 'Organización',
    items: [
      { href: '/work-locations', label: 'Centros', icon: 'building', roles: ['ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/calendars', label: 'Calendarios', icon: 'calendar', roles: ['ROLE_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/shifts', label: 'Turnos', icon: 'sparkles', roles: ['ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/planning-periods', label: 'Periodos', icon: 'layout-grid', roles: ['ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/reports', label: 'Reports', icon: 'layout-grid', roles: ['ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/platform', label: 'Plataforma', icon: 'sparkles', roles: ['ROLE_SUPER_ADMIN'] },
      { href: '/schedule', label: 'Planificación', icon: 'layout-grid', roles: ['ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH'] },
      { href: '/companies', label: 'Empresas', icon: 'building', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] },
      { href: '/api-keys', label: 'Claves', icon: 'shield', roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] }
    ]
  }
];

export function canAccessNavigationItem(item: NavigationItem, roles: RoleName[]) {
  if (roles.includes('ROLE_SUPER_ADMIN')) {
    return true;
  }

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
  if (pathname.startsWith('/work-locations')) return 'Centros de trabajo';
  if (pathname.startsWith('/shifts')) return 'Turnos';
  if (pathname.startsWith('/planning-periods')) return 'Periodos de planificación';
  if (pathname.startsWith('/reports')) return 'Reports';
  if (pathname.startsWith('/platform')) return 'Plataforma';
  if (pathname.startsWith('/schedule')) return 'Planificación';
  if (pathname.startsWith('/companies')) return 'Empresas';
  if (pathname.startsWith('/api-keys')) return 'Claves';
  if (pathname.startsWith('/profile')) return 'Perfil';
  return 'Victrium RH';
}
