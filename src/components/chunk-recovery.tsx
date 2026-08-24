'use client';

import { useEffect } from 'react';

const RELOAD_FLAG = 'victrium-rh-fichaje.chunk-reload';

function isChunkLoadError(event: ErrorEvent) {
  const message = `${event.message ?? ''} ${event.error instanceof Error ? event.error.message : ''}`.toLowerCase();
  return message.includes('chunkloaderror') || message.includes('loading chunk');
}

function shouldReloadFromError(event: ErrorEvent) {
  return isChunkLoadError(event) || /_next\/static\/chunks/i.test(event.filename ?? '');
}

export function ChunkRecovery() {
  useEffect(() => {
    const win = globalThis.window;
    if (!win) {
      return undefined;
    }

    const reloadOnce = () => {
      if (win.sessionStorage.getItem(RELOAD_FLAG) === '1') {
        return;
      }

      win.sessionStorage.setItem(RELOAD_FLAG, '1');
      win.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (shouldReloadFromError(event)) {
        reloadOnce();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason instanceof Error
            ? reason.message
            : typeof reason?.message === 'string'
              ? reason.message
              : '';

      if (/chunkloaderror|loading chunk/i.test(message)) {
        reloadOnce();
      }
    };

    win.addEventListener('error', onError);
    win.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      win.removeEventListener('error', onError);
      win.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
