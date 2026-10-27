using Cinema.Api.Movies;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddSingleton<IMovieCatalog, InMemoryMovieCatalog>();

var app = builder.Build();
app.MapHealthChecks("/health");
app.MapControllers();
app.Run();
