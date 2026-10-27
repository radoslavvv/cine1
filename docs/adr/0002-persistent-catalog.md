# Persist the catalog and screenings in PostgreSQL

Store movies, auditoriums, and showtimes in a Catalog-owned PostgreSQL schema through EF Core. The public schedule reads dated screenings instead of generating times from movie positions; screening timestamps represent UTC instants while schedule dates belong to Europe/Kyiv. This makes calendar boundaries explicit, including 23- and 25-hour daylight-saving days.

Each showtime records its occupied interval using the scheduled movie runtime plus a 15-minute turnaround. A PostgreSQL exclusion constraint rejects overlapping occupied intervals in the same auditorium, including concurrent inserts; changing a movie's catalog runtime later must not silently rewrite an existing screening's interval.

This increment exposes GET endpoints only. Development initialization seeds one seven-day schedule atomically and records completion under EF's migration lock. Restarting never shifts dates or replenishes deleted data: after those seven days, an empty schedule is expected until more screenings are deliberately added. Write APIs, administrator UI, and authentication are deferred together.

The v2 development seed expands the catalog to eight movies and rotates six-film lineups and twelve screening times per date across three auditoriums. It upgrades unchanged v1 sample screenings while preserving custom/edited screenings and existing movie metadata; conflicts with preserved screenings cause seed slots to be skipped. A version marker and transaction make this a one-time upgrade rather than a rolling reset.
