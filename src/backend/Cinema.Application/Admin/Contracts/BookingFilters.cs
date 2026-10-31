namespace Cinema.Application.Admin.Contracts;

public sealed record BookingFilters(string? Search = null, string? Date = null, int? MovieId = null,
    int? AuditoriumId = null, string? Status = null, int Page = 1);
