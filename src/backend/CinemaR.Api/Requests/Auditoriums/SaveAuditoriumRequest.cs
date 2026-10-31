using System.ComponentModel.DataAnnotations;

namespace CinemaR.Api.Requests.Auditoriums;

public sealed record SaveAuditoriumRequest(
    [Required, MaxLength(100)] string Name,
    [Range(1, 26)] int Rows, [Range(1, 40)] int SeatsPerRow,
    [Required, MinLength(1), MaxLength(4)] string[] SupportedFormats,
    bool ReplaceLayout = false);
