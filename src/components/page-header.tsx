import Link from 'next/link';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Array<{ href: string; label: string }>;
  actions?: ReactNode;
  stats?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, breadcrumbs, actions, stats }: PageHeaderProps) {
  return (
    <header className="page-header">
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          <ol>
            {breadcrumbs.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <div className="page-header__main">
        <div className="stack">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
      {stats ? <div className="page-stats">{stats}</div> : null}
    </header>
  );
}
