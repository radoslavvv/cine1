import { accountHeaderTheme as theme } from './AccountHeader.theme';
import { CinemaHeader } from '../../../../shared/components/CinemaHeader/CinemaHeader';
import { AccountNav } from '../AccountNav/AccountNav';
import { useAuth } from '../../hooks/useAuth';

export function AccountHeader() {
  const { error, refreshing, refresh } = useAuth();

  return (
    <CinemaHeader
      accountLinks={<AccountNav />}
      status={
        error ? (
          <div role="alert" className={theme.error}>
            <p>{error}</p>
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void refresh()}
              className={theme.retry}
            >
              {refreshing ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : undefined
      }
    />
  );
}
