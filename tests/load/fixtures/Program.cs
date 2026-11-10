using CinemaR.LoadTests;
using CinemaR.LoadTests.Commands;

if (args.Length < 2 || (args[0] == "verify" && args.Length != 3))
{
    throw new ArgumentException("Usage: <prepare|verify|observe> <output directory> [correctness|capacity|all]");
}

var run = new LoadTestRun(args[1]);
switch (args[0])
{
    case "prepare":
        await PrepareFixture.ExecuteAsync(run);
        break;
    case "verify":
        Environment.ExitCode = await VerifyBookings.ExecuteAsync(run, args[2]);
        break;
    case "observe":
        await ObservePostgres.ExecuteAsync(run);
        break;
    default:
        throw new ArgumentException("Expected prepare, verify, or observe.");
}
