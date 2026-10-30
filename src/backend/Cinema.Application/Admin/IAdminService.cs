namespace Cinema.Application.Admin;

public interface IAdminService
{
    Task<AdminCatalog> CatalogAsync(CancellationToken ct);
    Task<IReadOnlyList<AdminShowtime>> ShowtimesAsync(string date, CancellationToken ct);
    Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct);
    Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct);
    Task<int> SaveMovieAsync(int? id, SaveMovieCommand command, CancellationToken ct);
    Task<int> ArchiveMovieAsync(int id, CancellationToken ct);
    Task<int> DeleteMovieAsync(int id, CancellationToken ct);
    Task<int> SaveAuditoriumAsync(int? id, SaveAuditoriumCommand command, CancellationToken ct);
    Task<int> RetireAuditoriumAsync(int id, CancellationToken ct);
    Task<int> DeleteAuditoriumAsync(int id, CancellationToken ct);
    Task<int[]> SaveShowtimesAsync(int? id, SaveShowtimesCommand input, CancellationToken ct);
    Task<int> CancelShowtimeAsync(int id, CancellationToken ct);
}
