using CinemaR.Application.Movies.Services;
using CinemaR.Api.Controllers;
using CinemaR.Domain.Movies;
using CinemaR.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Xunit;

namespace CinemaR.Tests;

public sealed class ArchitectureTests
{
    [Fact]
    public void Inner_layers_have_no_web_or_persistence_dependencies()
    {
        var forbidden = new[] { "CinemaR.Api", "CinemaR.Infrastructure", "Microsoft.EntityFrameworkCore", "Microsoft.AspNetCore", "Npgsql" };
        foreach (var assembly in new[] { typeof(Movie).Assembly, typeof(MovieService).Assembly })
            Assert.DoesNotContain(assembly.GetReferencedAssemblies(), reference => forbidden.Any(name => reference.Name!.StartsWith(name)));
        Assert.DoesNotContain(typeof(Movie).Assembly.GetReferencedAssemblies(), reference => reference.Name == "CinemaR.Application");
    }

    [Fact]
    public void Controllers_depend_on_services_rather_than_repositories_or_EF()
    {
        foreach (var controller in typeof(AdminController).Assembly.GetTypes().Where(t => t.IsSubclassOf(typeof(Microsoft.AspNetCore.Mvc.ControllerBase))))
            foreach (var parameter in controller.GetConstructors().SelectMany(c => c.GetParameters()))
            {
                Assert.DoesNotContain("Repository", parameter.ParameterType.Name);
                Assert.StartsWith("CinemaR.Application.", parameter.ParameterType.Namespace!);
            }
    }

    [Fact]
    public void Moved_EF_model_matches_the_snapshot_and_preserves_migration_ids()
    {
        using var db = new CinemaRDbContext(new DbContextOptionsBuilder<CinemaRDbContext>()
            .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused").Options);
        Assert.False(db.Database.HasPendingModelChanges());
        Assert.Equal(new[]
        {
            "20261027181852_InitialCatalog", "20261027193409_AuditoriumSeatLayouts",
            "20261027222120_ConfirmedBookings", "20261027230727_TicketQrCodes",
            "20261027233011_ShowtimeFormats", "20261030163818_Administration", "20261031002743_CustomerIdentity",
            "20261031013637_CinemaRSchema"
        }, db.Database.GetMigrations());
        Assert.Equal(typeof(CinemaRDbContext).Assembly, db.GetService<IMigrationsAssembly>().Assembly);
    }
}
