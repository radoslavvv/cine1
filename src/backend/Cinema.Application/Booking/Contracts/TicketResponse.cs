namespace Cinema.Application.Booking.Contracts;

public sealed record TicketResponse(int SeatId, string RowLabel, int Number, string TicketCode);
