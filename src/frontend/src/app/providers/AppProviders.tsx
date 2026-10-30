import { Suspense, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QueryDevtools } from './QueryDevtools';
import { MotionConfig } from 'motion/react';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      {QueryDevtools && (
        <Suspense fallback={null}>
          <QueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
