import { QueryClient } from '@tanstack/react-query';

/**
 * Standard TanStack QueryClient configured for CSR reactivity.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 10, // 10 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
