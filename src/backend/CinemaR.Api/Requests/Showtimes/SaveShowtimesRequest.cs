using System.ComponentModel.DataAnnotations;

namespace CinemaR.Api.Requests.Showtimes;

public sealed record SaveShowtimesRequest(
    [Range(1, int.MaxValue)]
    int MovieId,

    [Range(1, int.MaxValue)]
    int AuditoriumId,

    [Required]
    string Format,

    [Required]
    string LocalTime,

    [Required, MinLength(1), MaxLength(366)]
    string[] Dates);
