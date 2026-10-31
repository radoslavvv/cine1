import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { accountAction } from '../api/authApi';
import { safeReturnTo } from '../model/accountNavigation';
import { accountTitles } from '../model/accountPresentation';

export function useAccountPage(action: string, params: URLSearchParams) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const needsPassword = ['sign-in', 'register', 'reset-password'].includes(
    action,
  );
  const newPassword = action !== 'sign-in';
  const verify = action === 'verify-email';
  const destination = safeReturnTo(params.get('returnTo'));
  const returnQuery = `?${new URLSearchParams({ returnTo: destination })}`;

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (busy) {
      return;
    }

    setError('');
    setMessage('');

    if (needsPassword && newPassword && password !== confirmPassword) {
      setError('Your passwords do not match.');

      return;
    }

    setBusy(true);

    try {
      const result = await accountAction(action, {
        email: email.trim(),
        password,
        userId: params.get('userId') ?? '',
        token: params.get('token') ?? '',
      });

      setMessage(result);
      setPassword('');
      setConfirmPassword('');

      if (action === 'sign-in') {
        await auth.refresh();

        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('cinemar-account');

          channel.postMessage('changed');
          channel.close();
        }

        navigate(destination, { replace: true });
      }

      // Remove credentials from browser history once a verification/reset link has been consumed.
      if (verify || action === 'reset-password') {
        navigate(`/account/${action}`, { replace: true });
      }
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    title: accountTitles[action],
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
  };
}
