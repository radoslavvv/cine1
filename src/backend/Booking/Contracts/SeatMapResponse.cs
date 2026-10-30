namespace Cinema.Api.Booking.Contracts;

public sealed record SeatMapResponse(
    int ShowtimeId, DateTime StartsAt, DateTime ServerNow, bool SelectionOpen,
    SeatMapMovie Movie, SeatMapAuditorium Auditorium, IReadOnlyList<SeatResponse> Seats);
public sealed record SeatMapMovie(int Id, string Title, int DurationMinutes, string[] Genres, string? PosterUrl = null, string? BackdropUrl = null);
public sealed record SeatMapAuditorium(int Id, string Name);
public sealed record SeatResponse(int Id, string RowLabel, int Number, int GridRow, int GridColumn, bool Taken);
