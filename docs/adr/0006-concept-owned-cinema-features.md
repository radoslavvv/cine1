# Organize cinema features by concept

Movies, Auditoriums, Showtimes, and Bookings own their relevant backend services and repository interfaces and their frontend queries and types. Administration composes these features instead of owning a combined service/repository; remove the active AdminCatalog contract and combined endpoint/query while retaining movie and auditorium management.

Use Showtimes throughout the application, including the customer browsing feature. Remove Schedule as a separate concept and as presentation terminology. Bookings owns seat availability, checkout, confirmation, tickets, and personal booking history; identity owns authentication and account state. This replaces the feature-ownership decisions in ADR 0003 and the Catalog ownership described in ADR 0002.

Use `/showtimes` for the customer browsing route and remove the `/schedule` route. The canonical product name is `cinemaR`; replace the physical `catalog` schema with `cinemaR` through a migration that preserves existing data and migration history. Historical migrations remain records of earlier database states.

Keep the modules within the existing application and database. Preserve shared transaction coordination, advisory lock identity, and current business rules across concept-specific repositories: concurrent booking and administration operations must retain their existing atomicity. In particular, preserve booked auditorium layout protection, booked-showtime edit restrictions, and retained bookings when a showtime is cancelled.

These decisions were accepted during the design interview. Use `cinemaR` for product and database/schema names, `CinemaR.*` for C# projects and namespaces, and lowercase `cinemar` where tooling requires it. The complete scope was confirmed before implementation.
