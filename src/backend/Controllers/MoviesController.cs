using Cinema.Api.Movies;
using Microsoft.AspNetCore.Mvc;

namespace Cinema.Api.Controllers;

[ApiController]
[Route("api/movies")]
public sealed class MoviesController(IMovieCatalog catalog) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<Movie>> GetMovies() => Ok(catalog.GetMovies());
}
