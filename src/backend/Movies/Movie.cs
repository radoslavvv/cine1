namespace Cinema.Api.Movies;

public sealed class Movie
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public int DurationMinutes { get; set; }
    public required string[] Genres { get; set; }
    public required string Synopsis { get; set; }
}
