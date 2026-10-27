using Cinema.Api.Schedule;

namespace Cinema.Api.Booking;

public sealed class ConfirmedBooking
{
    public Guid Id { get; set; }
    public required string ConfirmationToken { get; set; }
    public required string Email { get; set; }
    public int ShowtimeId { get; set; }
    public Showtime Showtime { get; set; } = null!;
    public DateTime ConfirmedAt { get; set; }
    public List<BookedSeat> Seats { get; set; } = [];
}

public sealed class BookedSeat
{
    public int ShowtimeId { get; set; }
    public int SeatId { get; set; }
    public Seat Seat { get; set; } = null!;
    public Guid BookingId { get; set; }
    public ConfirmedBooking Booking { get; set; } = null!;
}
