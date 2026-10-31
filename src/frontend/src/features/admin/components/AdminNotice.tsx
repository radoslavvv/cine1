import { Button } from '@/shared/components/ui/button';
import { adminTheme as t } from '../admin.theme';

export function AdminNotice({
  error,
  success,
  retry,
}: {
  error?: string;
  success?: string;
  retry?: () => void;
}) {
  if (error) {
    return (
      <div className={t.error} role="alert">
        {error}
        {retry && (
          <Button variant="link" className="ml-3 h-auto p-0" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <p className={t.notice} role="status">
        {success}
      </p>
    );
  }

  return null;
}
