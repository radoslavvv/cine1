namespace Cinema.Application.Admin.Contracts;

public sealed record AdminBooking(Guid Id, string Email, DateTime ConfirmedAt, int ShowtimeId,
    string MovieTitle, string AuditoriumName, DateTime StartsAt, bool IsCancelled, IReadOnlyList<string> Seats);
