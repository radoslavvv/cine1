using Cinema.Api.Movies;

namespace Cinema.Api.Schedule;

public sealed class Showtime
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public Movie Movie { get; set; } = null!;
    public int AuditoriumId { get; set; }
    public Auditorium Auditorium { get; set; } = null!;
    public DateTime StartsAt { get; set; }
    public string Format { get; set; } = "2D";
    // The occupied interval includes the movie's scheduled runtime and turnaround.
    public DateTime OccupiedUntil { get; set; }
}
