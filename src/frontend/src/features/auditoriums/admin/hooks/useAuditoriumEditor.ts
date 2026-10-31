import { useState, type FormEvent } from 'react';
import type { AdminAuditorium } from '../types';
import {
  dimensions,
  emptyAuditorium,
} from '@/features/auditoriums/admin/model/auditoriumsEditor';
import { useAdminMutation } from '../../../admin/hooks/useAdminMutation';

export function useAuditoriumEditor(rooms: AdminAuditorium[]) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ ...emptyAuditorium });
  const action = useAdminMutation();
  const room = rooms.find((a) => a.id === editing);
  const originalSize = room ? dimensions(room) : null;
  const replaceLayout =
    !!originalSize &&
    (originalSize.rows !== draft.rows ||
      originalSize.seatsPerRow !== draft.seatsPerRow);
  const preview =
    room && !replaceLayout
      ? room.seats
      : Array.from(
          { length: Math.max(0, Math.min(26, draft.rows)) },
          (_, row) =>
            Array.from(
              { length: Math.max(0, Math.min(40, draft.seatsPerRow)) },
              (_, column) => ({
                rowLabel: String.fromCharCode(65 + row),
                number: column + 1,
                gridRow: row,
                gridColumn: column,
              }),
            ),
        ).flat();

  function edit(value: AdminAuditorium) {
    setEditing(value.id);
    setDraft({
      name: value.name,
      ...dimensions(value),
      supportedFormats: value.supportedFormats,
    });
    action.reset();
    document.getElementById('auditorium-form-title')?.focus();
  }

  function clear() {
    setEditing(null);
    setDraft({ ...emptyAuditorium });
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (
      await action.execute({
        path: editing === null ? 'auditoriums' : `auditoriums/${editing}`,
        method: editing === null ? 'POST' : 'PUT',
        body: { ...draft, replaceLayout },
        message:
          editing === null ? 'Auditorium created.' : 'Auditorium updated.',
      })
    ) {
      clear();
    }
  }

  return { editing, draft, setDraft, room, preview, edit, clear, save, action };
}
