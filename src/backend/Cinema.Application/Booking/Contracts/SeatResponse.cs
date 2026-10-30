namespace Cinema.Application.Booking.Contracts;

public sealed record SeatResponse(int Id, string RowLabel, int Number, int GridRow, int GridColumn, bool Taken);
