using System.ComponentModel.DataAnnotations;

namespace Cinema.Api.Admin;

public sealed record MovieInput(
    [Required, MaxLength(200)] string Title,
    [Range(1, 1440)] int DurationMinutes,
    [Required, MinLength(1), MaxLength(20)] string[] Genres,
    [Required(AllowEmptyStrings = true), MaxLength(10000)] string Synopsis,
    [MaxLength(2048)] string? PosterUrl, [MaxLength(2048)] string? BackdropUrl);

public sealed record AuditoriumInput(
    [Required, MaxLength(100)] string Name,
    [Range(1, 26)] int Rows, [Range(1, 40)] int SeatsPerRow,
    [Required, MinLength(1), MaxLength(4)] string[] SupportedFormats,
    bool ReplaceLayout = false);

public sealed record ShowtimeInput(
    [Range(1, int.MaxValue)] int MovieId, [Range(1, int.MaxValue)] int AuditoriumId,
    [Required] string Format, [Required] string LocalTime,
    [Required, MinLength(1), MaxLength(366)] string[] Dates);

public sealed record AdminMovie(int Id, string Title, int DurationMinutes, string[] Genres,
    string Synopsis, string? PosterUrl, string? BackdropUrl, bool IsArchived, bool IsUsed);
public sealed record AdminSeat(string RowLabel, int Number, int GridRow, int GridColumn);
public sealed record AdminAuditorium(int Id, string Name, string[] SupportedFormats,
    bool IsRetired, bool LayoutLocked, bool IsUsed, IReadOnlyList<AdminSeat> Seats);
public sealed record AdminCatalog(IReadOnlyList<AdminMovie> Movies, IReadOnlyList<AdminAuditorium> Auditoriums);
public sealed record AdminShowtime(int Id, int MovieId, string MovieTitle, int AuditoriumId,
    string AuditoriumName, DateTime StartsAt, DateTime OccupiedUntil, int DurationMinutes,
    string Format, bool IsCancelled, int BookingCount);
public sealed record AdminBooking(Guid Id, string Email, DateTime ConfirmedAt, int ShowtimeId,
    string MovieTitle, string AuditoriumName, DateTime StartsAt, bool IsCancelled, IReadOnlyList<string> Seats);
public sealed record BookingPage(int Page, int PageSize, int Total, IReadOnlyList<AdminBooking> Items);
public sealed record BookingFilters(string? Search = null, string? Date = null, int? MovieId = null,
    int? AuditoriumId = null, string? Status = null, int Page = 1);

public sealed class AdminRuleException(string message, int status = 409) : Exception(message)
{
    public int Status { get; } = status;
}
