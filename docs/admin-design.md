# Admin section design

Status: implemented. Authentication and administrator access are now covered by [the authentication design](authentication-design.md).

## Agreed scope

- Provide an `/admin` section. The page and admin endpoints require the verified administrator account in every environment. This supersedes the initial Development-only access restriction.
- Support creating and updating movies, showtimes, and auditoriums.
- Booking management is view-only. Screening cancellation is the sole agreed operation that indirectly cancels bookings.
- Once a showtime has confirmed bookings, prevent changing its movie, start time, or auditorium. Allow an explicit screening cancellation flow that also cancels its bookings.
- Start auditorium creation with a name, row count, seats per row, and a seating preview. Permanently lock the layout after its first confirmed booking; use a replacement auditorium and retire the old one after its remaining screenings finish. This supersedes the initial upcoming-bookings-only restriction.
- Screening cancellation invalidates its tickets, removes it from the public schedule, and preserves bookings for admin viewing. Existing confirmation links display "Screening cancelled." Email notifications are deferred.
- Movie forms accept optional poster and backdrop image URLs with placeholder fallbacks. File uploads are deferred.
- Support creating one showtime or repeating the same movie, auditorium, format, and local start time over multiple selected dates. Retain the 15-minute turnaround and report conflicting screenings when rejecting overlaps.
- Repeated scheduling is atomic: any conflict rejects the entire batch without creating screenings. Identify conflicting dates and screenings so the admin can adjust and retry.
- Archive movies and retire auditoriums rather than deleting referenced records. Prevent new scheduling against archived/retired records. Existing upcoming screenings must finish or be cancelled before archiving/retiring. Permit hard deletion only for unused records.
- Movie title, synopsis, genres, and artwork edits update wherever displayed. Runtime changes apply only to newly created screenings; existing screenings retain their scheduled runtime and turnaround. A different film requires a separate movie record.
- Booking lists support email/booking-ID search; screening-date, movie, auditorium, and active/cancelled filters; pagination; and read-only details. Show email, screening, seats, confirmation time, and status.
- Each auditorium specifies supported formats from 2D, 3D, IMAX 2D, and IMAX 3D. Restrict new screenings accordingly and prevent removing a format used by upcoming screenings.

## Existing constraints

- Cinema dates use Europe/Kyiv; persisted screening instants use UTC.
- An auditorium is occupied for the scheduled runtime plus a 15-minute turnaround. Database constraints reject overlapping intervals.
- Existing confirmations read movie, auditorium, and seat information from current related records.
- Movie posters and backdrops currently come from local assets mapped by movie title.
- Bookings currently contain an email, showtime, confirmation time, and seats; they do not represent collected payments.
