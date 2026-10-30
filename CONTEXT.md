# Cinema Booking

A cinema offers scheduled screenings of movies. Customers select seats for a screening and complete a booking to receive tickets.

## Language

**Guest customer**:
A customer who purchases tickets without registering or signing into an account.
_Avoid_: Anonymous user, registered customer

**Movie**:
A film in the cinema's catalog, independent of when or where it is screened.
_Avoid_: Showtime, screening

**Archived movie**:
A movie retained in the catalog's history but unavailable for new scheduling. Its existing screenings and bookings remain part of the cinema's records.
_Avoid_: Deleted movie

**Auditorium**:
A room in a cinema containing a screen and a defined layout of seats.
_Avoid_: Cinema, theater

**Genre**:
A category describing a movie's subject or style. A movie can belong to multiple genres.
_Avoid_: Format

**Format**:
The presentation type of a showtime: 2D, 3D, IMAX 2D, or IMAX 3D. The same movie can have showtimes in different formats.
_Avoid_: Genre, auditorium, room

**Showtime**:
A scheduled screening of one movie in one auditorium at a particular date and time.
_Avoid_: Movie, session

**Schedule**:
The collection of showtimes offered by a cinema on a given date.
_Avoid_: Movie catalog, booking list

**Cancelled showtime**:
A screening withdrawn by the cinema. Its bookings remain as records, but its tickets no longer grant admission.
_Avoid_: Finished showtime, deleted showtime

**Retired auditorium**:
An auditorium withdrawn from future scheduling after its remaining screenings finish. Its seating layout and past bookings remain part of the cinema's records.
_Avoid_: Deleted auditorium

**Started showtime**:
A showtime whose scheduled start has passed and whose scheduled runtime has not yet elapsed.
_Avoid_: Finished showtime

**Upcoming showtime**:
A showtime whose scheduled start is still in the future.
_Avoid_: Started showtime

**Finished showtime**:
A showtime whose scheduled start plus scheduled runtime has elapsed. Auditorium turnaround is not part of the screening's runtime.
_Avoid_: Started showtime

**Scheduled runtime**:
The film duration assigned to a showtime when it is created. Later changes to the movie's catalog runtime do not change this duration.
_Avoid_: Turnaround, current catalog runtime

**Turnaround**:
The time reserved in an auditorium after a screening for cleaning and preparing for the next screening. A screening occupies its auditorium for the film's scheduled runtime plus this turnaround.
_Avoid_: Runtime, intermission

**Seat**:
A numbered place in an auditorium. Its availability is specific to a showtime.
_Avoid_: Ticket, reservation

**Hold**:
A temporary, exclusive claim on selected seats for a showtime while a customer prepares to check out. It has an expiration time and is not a confirmed booking.
_Avoid_: Booking, reservation

**Seat selection**:
The seats a customer has chosen for a showtime. A selection alone does not reserve seats or grant admission.
_Avoid_: Hold, booking, ticket

**Booking**:
A customer's record for selected seats at one showtime. Only a confirmed booking grants admission through tickets; confirmation does not itself imply that a payment was collected.
_Avoid_: Hold, ticket, reservation

**Checkout**:
The step where a guest customer reviews selected seats and supplies an email address before confirming a booking.
_Avoid_: Payment, hold

**Taken seat**:
A seat assigned to a confirmed booking for a particular showtime and unavailable for another booking at that showtime. The same physical seat can remain available at other showtimes.
_Avoid_: Held seat, globally occupied seat

**Ticket**:
An admission entitlement for one seat at one showtime, issued for a confirmed booking.
_Avoid_: Booking, receipt

**Ticket code**:
A unique credential for one ticket, presented as a QR code for staff verification. It identifies that ticket rather than the customer's entire booking.
_Avoid_: Confirmation link, booking code, seat number
