namespace Cinema.Api.Booking.Repositories;

public interface ISeatMapRepository
{
    Task<SeatMapReadModel?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}

public sealed record SeatMapReadModel(
    int ShowtimeId, DateTime StartsAt, int MovieId, string MovieTitle, int DurationMinutes,
    string[] Genres, int AuditoriumId, string AuditoriumName, IReadOnlyList<SeatReadModel> Seats);
public sealed record SeatReadModel(int Id, string RowLabel, int Number, int GridRow, int GridColumn, bool Taken);
