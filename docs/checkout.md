# Guest checkout

## Decisions agreed on 2026-10-28

- Add checkout after seat selection, with a Confirm booking action and no payment integration.
- Defer temporary seat holds. Entering checkout does not reserve seats.
- Confirmed bookings make their seats taken for that showtime. Store bookings durably so reopening the seat map shows taken seats.

## Proposed complete flow awaiting final design confirmation

- Carry forward the previously agreed guest checkout: email only, immediate tickets, and a private confirmation link; email delivery remains deferred.
- Carry forward the maximum of eight seats, one seat type, and no prices.
- Review the movie, showtime, auditorium, and selected seats before confirmation. Returning to selection preserves the selection within the current flow; abandoning or refreshing an unconfirmed flow clears it.
- Confirm only before the showtime starts. Validate the selected seats against that showtime on the server.
- Check availability and save all selected seats atomically. If any selected seat was booked by someone else, reject the whole booking, refresh availability, and let the customer choose again. No partial booking.
- Prevent duplicate bookings from double clicks or retries of the same confirmation.
- Show taken seats distinctly and disable their selection. Other showtimes in the same auditorium retain their own availability.
- Show confirmed tickets and a private confirmation link that remains usable after refresh. An unguessable link identifies the booking; an email address alone does not grant access.

This document extends the completed seat-selection increment in `docs/seat-selection.md`. The implementation has not started; final confirmation of this complete flow is pending.
