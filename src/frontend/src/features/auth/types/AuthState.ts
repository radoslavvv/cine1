import type { Customer } from './Customer';

export interface AuthState {
  customer: Customer | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}
