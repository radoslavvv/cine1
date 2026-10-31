namespace CinemaR.Application.SeatMaps.ReadModels;

public sealed record SeatReadModel(int Id, string RowLabel, int Number, int GridRow, int GridColumn, bool Taken);
