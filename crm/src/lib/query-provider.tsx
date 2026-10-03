'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { queryClient as defaultClient } from './query-client';

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client] = useState(() => defaultClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
