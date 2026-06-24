'use client';

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useState } from 'react';
import { notifyServerError } from '@/lib/notify-api-error';

function isServerApiError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === 'ApiError' &&
    typeof (error as Error & { statusCode?: number }).statusCode === 'number' &&
    ((error as Error & { statusCode: number }).statusCode >= 500 ||
      (error as Error & { statusCode: number }).statusCode === 0)
  );
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silentError) return;
            if (isServerApiError(error)) {
              notifyServerError();
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.silentError) return;
            if (isServerApiError(error)) {
              notifyServerError();
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
