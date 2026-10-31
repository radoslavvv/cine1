import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRequest } from '@/features/auth/api/adminRequest';

interface AdminCommand {
  path: string;
  method?: string;
  body?: unknown;
  message: string;
  confirm?: string;
}

export function useAdminMutation() {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (command: AdminCommand) =>
      adminRequest(command.path, {
        method: command.method ?? 'POST',
        headers:
          command.body === undefined
            ? undefined
            : { 'Content-Type': 'application/json' },
        body:
          command.body === undefined ? undefined : JSON.stringify(command.body),
      }),
    onSuccess: async () => {
      await Promise.all(
        [
          'movies',
          'auditoriums',
          'showtimes',
          'bookings',
          'my-bookings',
          'seat-map',
          'booking-confirmation',
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
    },
    retry: false,
  });

  async function execute(command: AdminCommand) {
    if (command.confirm && !window.confirm(command.confirm)) {
      return false;
    }

    try {
      await mutation.mutateAsync(command);

      return true;
    } catch {
      return false;
    }
  }

  return {
    execute,
    pending: mutation.isPending,
    reset: mutation.reset,
    error: mutation.error?.message,
    success: mutation.isSuccess ? mutation.variables.message : undefined,
  };
}
