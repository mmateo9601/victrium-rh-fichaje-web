import './globals.css';
import type { ReactNode } from 'react';

import { Topbar } from '../components/topbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="page-backdrop" />
        <Topbar />
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
