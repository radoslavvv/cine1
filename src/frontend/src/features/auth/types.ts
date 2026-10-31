export interface Customer {
  id: string;
  email: string;
  isAdministrator: boolean;
}

export interface AuthState {
  customer: Customer | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}
