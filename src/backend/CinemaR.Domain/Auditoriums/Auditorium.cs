namespace CinemaR.Domain.Auditoriums;

public sealed class Auditorium
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string[] SupportedFormats { get; set; } = ["2D", "3D", "IMAX 2D", "IMAX 3D"];
    public bool IsRetired { get; set; }
}
