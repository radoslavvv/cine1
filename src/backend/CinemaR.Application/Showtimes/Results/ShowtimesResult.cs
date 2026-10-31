using CinemaR.Application.Showtimes.Contracts;

namespace CinemaR.Application.Showtimes.Results;

public sealed record ShowtimesResult(IReadOnlyList<ShowtimeResponse> Showtimes, string? ValidationError = null);
