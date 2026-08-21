import './globals.css';
import type { ReactNode } from 'react';

import { Topbar } from '../components/topbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Topbar>{children}</Topbar>
      </body>
    </html>
  );
}
