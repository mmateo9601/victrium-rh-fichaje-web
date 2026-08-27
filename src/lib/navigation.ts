export type RoleName =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_COMPANY_ADMIN'
  | 'ROLE_RRHH'
  | 'ROLE_MANAGER'
  | 'ROLE_USER'
  | 'ROLE_AUDITOR'
  | 'ROLE_WORKFORCE_REPRESENTATIVE';

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

type RouteDefinition = {
  href: string;
  title: string;
  roles?: RoleName[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Operación',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: 'home' },
      { href: '/time-entries', label: 'Mi jornada', icon: 'clock' },
      { href: '/my-calendar', label: 'Mi calendario', icon: 'calendar' },
      { href: '/schedule', label: 'Planificación', icon: 'layout-grid', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
      { href: '/shifts', label: 'Turnos', icon: 'sparkles', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] }
    ]
  },
  {
    label: 'Personas',
    items: [
      { href: '/employees', label: 'Empleados', icon: 'users', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/users', label: 'Cuentas de acceso', icon: 'user', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/vacations', label: 'Vacaciones', icon: 'calendar', roles: ['ROLE_USER', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
      { href: '/permissions', label: 'Permisos', icon: 'shield', roles: ['ROLE_USER', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
      { href: '/incidents', label: 'Incidencias', icon: 'briefcase', roles: ['ROLE_USER', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] }
    ]
  },
  {
    label: 'Organización',
    items: [
      { href: '/companies', label: 'Empresas', icon: 'building', roles: ['ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN'] },
      { href: '/work-locations', label: 'Centros', icon: 'building', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/calendars', label: 'Calendarios', icon: 'calendar', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/planning-periods', label: 'Periodos', icon: 'layout-grid', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
      { href: '/reports', label: 'Informes', icon: 'layout-grid', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
      { href: '/platform', label: 'Configuración', icon: 'sparkles', roles: ['ROLE_SUPER_ADMIN'] },
      { href: '/api-keys', label: 'Claves', icon: 'shield', roles: ['ROLE_SUPER_ADMIN'] }
    ]
  }
];

const routeDefinitions: RouteDefinition[] = [
  { href: '/dashboard', title: 'Inicio' },
  { href: '/time-entries', title: 'Mi jornada' },
  { href: '/my-calendar', title: 'Mi calendario' },
  { href: '/schedule', title: 'Planificación', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { href: '/shifts', title: 'Turnos', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { href: '/employees', title: 'Empleados', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
  { href: '/users', title: 'Cuentas de acceso', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
  { href: '/vacations', title: 'Vacaciones', roles: ['ROLE_USER', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { href: '/permissions', title: 'Permisos', roles: ['ROLE_USER', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { href: '/incidents', title: 'Incidencias', roles: ['ROLE_USER', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { href: '/companies', title: 'Empresas', roles: ['ROLE_SUPER_ADMIN', 'ROLE_COMPANY_ADMIN'] },
  { href: '/work-locations', title: 'Centros de trabajo', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
  { href: '/calendars', title: 'Calendarios', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
  { href: '/planning-periods', title: 'Periodos', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN', 'ROLE_MANAGER'] },
  { href: '/reports', title: 'Informes', roles: ['ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_SUPER_ADMIN'] },
  { href: '/platform', title: 'Configuración', roles: ['ROLE_SUPER_ADMIN'] },
  { href: '/api-keys', title: 'Claves', roles: ['ROLE_SUPER_ADMIN'] },
  { href: '/profile', title: 'Perfil' }
];

export function canAccessNavigationItem(item: NavigationItem, roles: RoleName[]) {
  if (roles.includes('ROLE_SUPER_ADMIN')) {
    return true;
  }

  return !item.roles || item.roles.some((role) => roles.includes(role));
}

function matchesRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function canAccessRoute(route: RouteDefinition, roles: RoleName[]) {
  if (roles.includes('ROLE_SUPER_ADMIN')) {
    return true;
  }

  return !route.roles || route.roles.some((role) => roles.includes(role));
}

export function getNavigationTitle(pathname: string, roles: RoleName[] = []) {
  const route = routeDefinitions.find((entry) => matchesRoute(pathname, entry.href));

  if (!route) {
    return 'Victrium RH';
  }

  if (!canAccessRoute(route, roles)) {
    return 'Victrium RH';
  }

  return route.title;
}

export function canAccessRoutePath(pathname: string, roles: RoleName[]) {
  const route = routeDefinitions.find((entry) => matchesRoute(pathname, entry.href));

  if (!route) {
    return true;
  }

  return canAccessRoute(route, roles);
}

export function getPublicFallbackTitle() {
  return 'Victrium RH';
}
