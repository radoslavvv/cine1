using Cinema.Domain.Schedule;

namespace Cinema.Domain.Booking;

public sealed class BookedSeat
{
    public required string TicketCode { get; set; }
    public int ShowtimeId { get; set; }
    public int SeatId { get; set; }
    public Seat Seat { get; set; } = null!;
    public Guid BookingId { get; set; }
    public ConfirmedBooking Booking { get; set; } = null!;
}
