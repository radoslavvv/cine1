namespace Cinema.Api.Movies;

public interface IMovieCatalog
{
    IReadOnlyList<Movie> GetMovies();
}
