import { useEffect } from 'react';

export const useWebVitalsLogger = () => {
  useEffect(() => {
    const handler = (event: Event) => {
      // eslint-disable-next-line no-console
      console.log('[WebVitals]', event.type);
    };

    window.addEventListener('fcp', handler as EventListener);

    return () => {
      window.removeEventListener('fcp', handler as EventListener);
    };
  }, []);
};
