import type { PropsWithChildren, ReactNode } from 'react';
import { Suspense, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { ToastProvider } from '../components/ui/Toast';
import { FeatureFlagProvider } from './providers/FeatureFlagProvider';
import { AppErrorBoundary } from './providers/AppErrorBoundary';

export const Providers = ({ children }: PropsWithChildren): ReactNode => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    [],
  );

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider>
          <ToastProvider>
            <Suspense fallback={<div role="status">正在加载体验...</div>}>
              {children}
            </Suspense>
          </ToastProvider>
        </FeatureFlagProvider>
        {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};
