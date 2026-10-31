using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Movies.Contracts;
using CinemaR.Application.Auditoriums.Contracts;
namespace CinemaR.Application.Showtimes.Contracts;

public sealed record ShowtimeResponse(int Id, DateTime StartsAt, MovieResponse Movie, AuditoriumResponse Auditorium, string Format);
