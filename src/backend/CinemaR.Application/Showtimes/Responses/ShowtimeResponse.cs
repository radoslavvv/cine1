using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Movies.Responses;
using CinemaR.Application.Auditoriums.Responses;
namespace CinemaR.Application.Showtimes.Responses;

public sealed record ShowtimeResponse(int Id, DateTime StartsAt, MovieResponse Movie, AuditoriumResponse Auditorium, string Format);
