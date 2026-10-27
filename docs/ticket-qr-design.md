# Seat summary and ticket QR design

## Feedback agreed on 2026-10-28

- Remove the seat summary gradient, divider line, button arrow, and explanatory text below Continue to checkout.
- Reposition Clear selection so it belongs naturally with the selected seats.
- Keep the existing booking confirmation experience and add one QR code per ticket/seat.
- Ticket codes are intended for verification by staff using separate software.
- Staff scanning is hypothetical. Verification, scanner integration, offline support, and check-in behavior are deferred from this increment.

## Implementation

- Use a compact, flat seat summary with Clear selection alongside selection details and the checkout action clearly separated by spacing.
- Generate QR images in the C# backend. Give each ticket its own persistent random credential, separate from the private booking confirmation link.
- Display a QR on each confirmed ticket without adding a verification API or staff software integration.
- QRCoder renders PNG images in C# via `GET /api/bookings/{confirmationToken}/tickets/{seatId}/qr`. A ticket image is accessible only within its owning booking's private link and has caching disabled.
- The QR contains only the ticket's 64-character random code. It contains no email address or booking confirmation token. Scanning currently yields that code; it does not validate admission.
- A unique database index enforces distinct ticket codes. Existing booked seats receive independent codes during migration; reopening a booking or retrying confirmation preserves its codes.

## Confirmed scope

Confirmed by the user on 2026-10-28: clean up the seat summary as described above, preserve the existing confirmation experience, and generate one QR per confirmed ticket in C# using a persistent ticket credential. Staff verification is future work.

## Manual verification

- Select seats on desktop and mobile: the flat summary groups Clear selection with the seats and shows a plain checkout button without a divider, arrow, or text below it.
- Confirm two seats: each admission card displays a QR, and decoding each image yields a different ticket code matching the API response.
- Refresh the private confirmation link and replay the original confirmation request: both retain the same ticket codes and QR images.
- Request another booking's seat under the wrong confirmation token, or use an invalid token: the QR endpoint returns 404.
- Apply the migration to a database with existing bookings: each existing seat gets a unique nonempty code without changing the booking's private link.
