import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AccountLayout } from '../components/AccountLayout/AccountLayout';
import { accountTheme } from '../auth.theme';
import { useAccountPage } from '../hooks/useAccountPage';

export function AccountPage() {
  const { action = 'sign-in' } = useParams();
  const [params] = useSearchParams();
  const {
    title,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy,
    message,
    error,
    needsPassword,
    newPassword,
    verify,
    returnQuery,
    submit,
  } = useAccountPage(action, params);
  if (!title)
    return (
      <AccountLayout title="Page not found.">
        <Link className={accountTheme.link} to="/account/sign-in">
          Sign in
        </Link>
      </AccountLayout>
    );
  return (
    <AccountLayout title={title}>
      <form onSubmit={submit} className="grid gap-5" aria-busy={busy}>
        {verify ? (
          <p className="text-muted">
            Confirm your email to start using your account.
          </p>
        ) : (
          <label className="text-sm">
            Email address
            <input
              className={accountTheme.input}
              type="email"
              name="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
          </label>
        )}
        {needsPassword && (
          <label className="text-sm">
            {action === 'reset-password' ? 'New password' : 'Password'}
            <input
              className={accountTheme.input}
              type="password"
              name="password"
              autoComplete={newPassword ? 'new-password' : 'current-password'}
              minLength={newPassword ? 12 : undefined}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
          </label>
        )}
        {needsPassword && newPassword && (
          <>
            <label className="text-sm">
              Confirm password
              <input
                className={accountTheme.input}
                type="password"
                autoComplete="new-password"
                required
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={busy}
              />
            </label>
          </>
        )}
        {action === 'sign-in' && (
          <Link
            className={`${accountTheme.link} justify-self-end text-sm`}
            to="/account/forgot-password"
          >
            Forgot password?
          </Link>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-sage">
            {message}
          </p>
        )}
        {!(message && (verify || action === 'reset-password')) && (
          <button
            className={accountTheme.button}
            disabled={
              busy ||
              (verify && (!params.get('token') || !params.get('userId'))) ||
              (action === 'reset-password' && !params.get('token'))
            }
          >
            {busy
              ? 'Please wait…'
              : {
                  'sign-in': 'Sign in',
                  register: 'Create account',
                  'verify-email': 'Verify email',
                  'resend-verification': 'Send verification link',
                  'forgot-password': 'Send reset link',
                  'reset-password': 'Reset password',
                }[action]}
          </button>
        )}
      </form>
      <nav className={accountTheme.help} aria-label="Account help">
        {action !== 'sign-in' && (
          <p>
            {action === 'register' && 'Already have an account? '}
            <Link
              className={accountTheme.link}
              to={`/account/sign-in${returnQuery}`}
            >
              Sign in
            </Link>
          </p>
        )}
        {action === 'sign-in' && (
          <p>
            New to cinemaR?{' '}
            <Link
              className={accountTheme.link}
              to={`/account/register${returnQuery}`}
            >
              Create account
            </Link>
          </p>
        )}
        {((action === 'register' && message) ||
          (action === 'sign-in' && error) ||
          action === 'verify-email') && (
          <Link className={accountTheme.link} to="/account/resend-verification">
            Resend verification
          </Link>
        )}
      </nav>
    </AccountLayout>
  );
}
