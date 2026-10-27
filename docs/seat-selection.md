# Seat selection

## Agreed scope

- Add a seat-selection page in a new Booking frontend feature, with a backend read endpoint supplying the selected showtime and auditorium layout.
- This increment ends at seat selection. Checkout, payment, ticket issuance, and registration are deferred.
- Each auditorium has its own grid-based layout with individually labeled seats, different row lengths, gaps, and aisles.
- Future guest checkout requires email only, displays tickets immediately, and provides a private confirmation link. Email delivery can follow later; this increment does not collect email.
- Selection is local to the current page. Refreshing or leaving clears it. Selecting a seat does not create a hold or prevent another visitor from selecting it.
- Selection is permitted only before the showtime starts. If the start time passes while the page is open, disable selection and explain that the showtime has started.
- Use one seat type with no prices. Display selected seat labels and their count.
- Allow up to eight selected seats, permit single-seat gaps, and provide a clear-selection action.
- End at the selection summary, with no checkout button.

## Implementation

- Link upcoming showtimes on the schedule to a directly addressable seat-selection page, with navigation back to the schedule.
- Follow the existing frontend feature and adjacent theme-file conventions. Match the current cinema styling and support keyboard and mobile use.
- Add a backend read endpoint for one showtime's movie details, start time, auditorium, and seat layout, following the existing controller/service/repository boundaries.
- Persist auditorium seats and their grid positions, and seed distinct layouts for the existing three auditoriums.
- With no holds or purchases implemented, all seeded seats begin available. Do not fabricate sold seats or imply that selecting a seat reserves it.
- Handle loading, failed requests with retry, unknown showtimes, and showtimes that have already started.

The page is `/booking/:showtimeId`; its read endpoint is `GET /api/showtimes/{showtimeId}/seats`. The response includes the movie, auditorium, seat IDs/labels/grid positions, UTC start time, server time, and whether selection is open. Unknown showtimes return 404 Problem Details; started showtimes return their layout with selection closed. Responses are not HTTP-cached.

Catalog owns physical seats; Booking reads them for a showtime through its own service/repository contract. No booking, hold, customer, or payment record is created. Development migration/seeding adds layouts independently of the existing catalog seed, preserving showtimes and existing custom seat layouts. The three sample layouts contain 56, 92, and 136 seats.

The page uses the returned server time to account for a different client clock. It checks the start boundary with a scheduled timer, a one-second interval, on focus/visibility changes, and again when a seat is toggled. Mobile layouts scroll horizontally within the seat map; seats use 44px button targets with accessible row/seat labels and pressed state.

## Manual walkthrough

1. Open the schedule and choose an upcoming showtime. Verify movie, Kyiv start time, and auditorium details.
2. Select eight seats. Further unselected seats become disabled; selected seats remain available to deselect. Clear the selection.
3. Refresh or navigate away and back. Selection starts empty.
4. Open showtimes in each auditorium. Verify shorter front rows, central aisles, and the largest auditorium's cross aisle.
5. At mobile width, scroll the map horizontally without widening the page. Tab to seats and toggle with Space or Enter.
6. Open an unknown showtime and a started showtime. Verify the missing-showtime message and closed selection respectively.
7. Leave a page open across its start time. Selection closes and the summary clears.
8. Stop the API or go offline to inspect initial failures, retry, and cached-layout refresh notices.

## Design status

The user confirmed the complete design and authorized implementation.

## Layout refinement

The user confirmed a left-side back control, film artwork presented as a card, and a wider centered seat map with the selection summary underneath. The brand header remains above Back to schedule at the left, followed by a horizontal poster/details card, then the map and full-width summary in a centered column. The card adapts to narrow screens. MovieArtwork and its local assets now live in shared UI so Schedule and Booking use the same artwork and illustrated fallback without importing each other's internals.
