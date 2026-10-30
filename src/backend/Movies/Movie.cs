namespace Cinema.Api.Movies;

public sealed class Movie
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public int DurationMinutes { get; set; }
    public required string[] Genres { get; set; }
    public required string Synopsis { get; set; }
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public bool IsArchived { get; set; }
}
