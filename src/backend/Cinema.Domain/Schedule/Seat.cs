namespace Cinema.Domain.Schedule;

public sealed class Seat
{
    public int Id { get; set; }
    public int AuditoriumId { get; set; }
    public Auditorium Auditorium { get; set; } = null!;
    public required string RowLabel { get; set; }
    public int Number { get; set; }
    public int GridRow { get; set; }
    public int GridColumn { get; set; }
}
