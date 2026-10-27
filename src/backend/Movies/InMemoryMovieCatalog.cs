namespace Cinema.Api.Movies;

public sealed class InMemoryMovieCatalog : IMovieCatalog
{
    private static readonly IReadOnlyList<Movie> Movies = Array.AsReadOnly<Movie>(
    [
        new(1, "Interstellar", 169),
        new(2, "Spirited Away", 125),
        new(3, "The Grand Budapest Hotel", 99)
    ]);

    public IReadOnlyList<Movie> GetMovies() => Movies;
}
