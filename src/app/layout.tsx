import './globals.css';
import type { ReactNode } from 'react';

import { ChunkRecovery } from '../components/chunk-recovery';
import { Topbar } from '../components/topbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ChunkRecovery />
        <Topbar>{children}</Topbar>
      </body>
    </html>
  );
}
