namespace CinemaR.Application.Auditoriums.Responses;

public sealed record AdminSeatResponse(string RowLabel, int Number, int GridRow, int GridColumn);
