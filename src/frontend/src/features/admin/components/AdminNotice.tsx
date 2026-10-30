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
  if (error)
    return (
      <div className={t.error} role="alert">
        {error}
        {retry && (
          <button className={`${t.link} ml-3`} onClick={retry}>
            Try again
          </button>
        )}
      </div>
    );
  if (success)
    return (
      <p className={t.notice} role="status">
        {success}
      </p>
    );
  return null;
}
