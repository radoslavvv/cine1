namespace CinemaR.Application.Booking.Responses;

public sealed record TicketResponse(int SeatId, string RowLabel, int Number, string TicketCode);
