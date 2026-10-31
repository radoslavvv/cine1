import { createContext } from 'react';
import type { AuthState } from '../types';

export const AuthContext = createContext<AuthState>({
  customer: null,
  loading: false,
  refreshing: false,
  error: '',
  refresh: async () => {},
  signOut: async () => {},
});
