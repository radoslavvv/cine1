using CinemaR.Domain.Showtimes;

namespace CinemaR.Domain.Booking;

public sealed class ConfirmedBooking
{
    public Guid Id { get; set; }
    public required string ConfirmationToken { get; set; }
    public required string Email { get; set; }
    public string? CustomerId { get; set; }
    public int ShowtimeId { get; set; }
    public Showtime Showtime { get; set; } = null!;
    public DateTime ConfirmedAt { get; set; }
    public List<BookedSeat> Seats { get; set; } = [];
}
