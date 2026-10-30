import { Button } from '@/shared/components/ui/button';
import type { AdminCatalog } from '../types';
import { useAuditoriumEditor } from '../hooks/useAuditoriumEditor';
import { AuditoriumForm } from '../components/AuditoriumForm';
import { AdminNotice } from '../components/AdminNotice';
import { adminTheme as t } from '../admin.theme';

export function AuditoriumsPanel({ catalog }: { catalog: AdminCatalog }) {
  const editor = useAuditoriumEditor(catalog.auditoriums);
  return (
    <>
      <AdminNotice
        error={editor.action.error}
        success={editor.action.success}
      />
      <div className={t.layout}>
        <AuditoriumForm
          draft={editor.draft}
          editing={editor.editing !== null}
          locked={editor.room?.layoutLocked ?? false}
          pending={editor.action.pending}
          preview={editor.preview}
          onChange={editor.setDraft}
          onSave={editor.save}
          onClear={editor.clear}
        />
        <section aria-label="Auditoriums">
          <div className={t.toolbar}>
            <h2 className={t.heading}>Auditoriums</h2>
            <span className={t.badge}>{catalog.auditoriums.length} rooms</span>
          </div>
          <div className={t.cards}>
            {catalog.auditoriums.map((room) => (
              <article className={t.card} key={room.id}>
                <div>
                  <h3 className={t.cardTitle}>{room.name}</h3>
                  <p className={t.muted}>
                    {room.seats.length} seats ·{' '}
                    {room.supportedFormats.join(' / ')}
                  </p>
                  {room.isRetired && <span className={t.badge}>Retired</span>}
                  {room.layoutLocked && (
                    <span className={t.badge}>Layout locked</span>
                  )}
                </div>
                <div className={t.actions}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={editor.action.pending}
                    onClick={() => editor.edit(room)}
                  >
                    Edit
                  </Button>
                  {!room.isRetired && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={editor.action.pending}
                      onClick={() =>
                        void editor.action.execute({
                          path: `auditoriums/${room.id}/retire`,
                          message: 'Auditorium retired.',
                          confirm: `Retire ${room.name}? It will no longer be available for new screenings.`,
                        })
                      }
                    >
                      Retire
                    </Button>
                  )}
                  {!room.isUsed && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={editor.action.pending}
                      onClick={() =>
                        void editor.action
                          .execute({
                            path: `auditoriums/${room.id}`,
                            method: 'DELETE',
                            message: 'Unused auditorium deleted.',
                            confirm: `Permanently delete ${room.name} and its seating layout?`,
                          })
                          .then((saved) => {
                            if (saved && editor.editing === room.id)
                              editor.clear();
                          })
                      }
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </article>
            ))}
            {catalog.auditoriums.length === 0 && (
              <p className={t.muted}>
                Add an auditorium to start scheduling screenings.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
