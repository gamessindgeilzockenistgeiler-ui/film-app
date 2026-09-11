'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('PWA-Service-Worker konnte nicht registriert werden:', error);
      });
    }
  }, []);

  return null;
}
