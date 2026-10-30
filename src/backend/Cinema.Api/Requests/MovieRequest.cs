using System.ComponentModel.DataAnnotations;

namespace Cinema.Api.Requests;

public sealed record MovieRequest(
    [Required, MaxLength(200)] string Title,
    [Range(1, 1440)] int DurationMinutes,
    [Required, MinLength(1), MaxLength(20)] string[] Genres,
    [Required(AllowEmptyStrings = true), MaxLength(10000)] string Synopsis,
    [MaxLength(2048)] string? PosterUrl, [MaxLength(2048)] string? BackdropUrl);
