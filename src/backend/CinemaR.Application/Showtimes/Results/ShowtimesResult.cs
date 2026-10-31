using CinemaR.Application.Showtimes.Responses;

namespace CinemaR.Application.Showtimes.Results;

public sealed record ShowtimesResult(IReadOnlyList<ShowtimeResponse> Showtimes, string? ValidationError = null);
