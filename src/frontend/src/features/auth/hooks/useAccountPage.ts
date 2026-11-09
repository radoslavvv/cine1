import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
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
  const [validationError, setValidationError] = useState('');
  const needsPassword = ['sign-in', 'register', 'reset-password'].includes(
    action,
  );
  const newPassword = action !== 'sign-in';
  const verify = action === 'verify-email';
  const destination = safeReturnTo(params.get('returnTo'));
  const returnQuery = `?${new URLSearchParams({ returnTo: destination })}`;

  const mutation = useMutation({
    // Keep passwords and email-link tokens out of the mutation's stored variables.
    mutationFn: () =>
      accountAction(action, {
        email: email.trim(),
        password,
        userId: params.get('userId') ?? '',
        token: params.get('token') ?? '',
      }),
    retry: false,
    gcTime: 0,
    onSuccess: async () => {
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
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();

    if (mutation.isPending) {
      return;
    }

    setValidationError('');
    mutation.reset();

    if (needsPassword && newPassword && password !== confirmPassword) {
      setValidationError('Your passwords do not match.');

      return;
    }

    mutation.mutate();
  }

  return {
    title: accountTitles[action],
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy: mutation.isPending,
    message: mutation.isSuccess ? mutation.data : '',
    error: validationError || mutation.error?.message || '',
    needsPassword,
    newPassword,
    verify,
    returnQuery,
    submit,
  };
}
