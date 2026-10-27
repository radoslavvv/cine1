# Cinema Booking

A cinema offers scheduled screenings of movies. Customers select seats for a screening and complete a booking to receive tickets.

## Language

**Movie**:
A film in the cinema's catalog, independent of when or where it is screened.
_Avoid_: Showtime, screening

**Auditorium**:
A room in a cinema containing a screen and a defined layout of seats.
_Avoid_: Cinema, theater

**Showtime**:
A scheduled screening of one movie in one auditorium at a particular date and time.
_Avoid_: Movie, session

**Seat**:
A numbered place in an auditorium. Its availability is specific to a showtime.
_Avoid_: Ticket, reservation

**Hold**:
A temporary, exclusive claim on selected seats for a showtime while a customer prepares to check out. It has an expiration time and is not a confirmed booking.
_Avoid_: Booking, reservation

**Booking**:
A customer's purchase record for selected seats at one showtime. It may be pending, confirmed, or failed; only a confirmed booking grants admission through tickets.
_Avoid_: Hold, ticket, reservation

**Ticket**:
An admission entitlement for one seat at one showtime, issued for a confirmed booking.
_Avoid_: Booking, receipt
