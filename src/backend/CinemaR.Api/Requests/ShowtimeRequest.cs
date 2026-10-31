using System.ComponentModel.DataAnnotations;

namespace CinemaR.Api.Requests;

public sealed record ShowtimeRequest(
    [Range(1, int.MaxValue)] int MovieId, [Range(1, int.MaxValue)] int AuditoriumId,
    [Required] string Format, [Required] string LocalTime,
    [Required, MinLength(1), MaxLength(366)] string[] Dates);
