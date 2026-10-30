namespace Cinema.Application.Schedule.Contracts;

public sealed record GetScheduleQuery(DateOnly? Date, string? Genre, string? Format);
