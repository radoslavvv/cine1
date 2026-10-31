export function readBookingDraft(
  showtimeId: string,
): { seatIds: number[]; checkout: boolean } | null {
  try {
    const draft = JSON.parse(
      sessionStorage.getItem(`cinemar-selection-${showtimeId}`) ?? 'null',
    ) as { seatIds?: unknown; checkout?: unknown; savedAt?: number } | null;

    if (
      !draft ||
      !Array.isArray(draft.seatIds) ||
      draft.seatIds.length > 8 ||
      !draft.seatIds.every((id) => Number.isSafeInteger(id) && id > 0) ||
      !draft.savedAt ||
      Date.now() - draft.savedAt > 2 * 60 * 60 * 1000
    ) {
      return null;
    }

    return {
      seatIds: [...new Set(draft.seatIds as number[])],
      checkout: draft.checkout === true,
    };
  } catch {
    return null;
  }
}

export function saveBookingDraft(
  showtimeId: string,
  seatIds: number[],
  checkout: boolean,
) {
  try {
    if (seatIds.length === 0) {
      sessionStorage.removeItem(`cinemar-selection-${showtimeId}`);
    } else {
      sessionStorage.setItem(
        `cinemar-selection-${showtimeId}`,
        JSON.stringify({ seatIds, checkout, savedAt: Date.now() }),
      );
    }
  } catch {
    /* Selection still works when browser storage is unavailable. */
  }
}
