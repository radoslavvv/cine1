# Preserve auditorium layouts after the first confirmed booking

Permanently lock an auditorium's seating layout once any confirmed booking references it, including after screenings finish or are cancelled. Bookings reference physical seats, so allowing later layout edits would change historical ticket details or break those references. Use a replacement auditorium for a different layout and retire the old one after its remaining screenings finish; this trades convenient reuse of an auditorium record for stable booking history without introducing versioned seating layouts.
