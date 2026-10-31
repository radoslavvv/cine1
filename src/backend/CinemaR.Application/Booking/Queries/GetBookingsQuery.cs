namespace CinemaR.Application.Booking.Queries;

public sealed record GetBookingsQuery(string? Search = null, string? Date = null, int? MovieId = null,
    int? AuditoriumId = null, string? Status = null, int Page = 1);
