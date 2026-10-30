namespace Cinema.Domain.Schedule;

public static class CinemaCalendar
{
    public const string TimeZoneId = "Europe/Kyiv";
    public static TimeZoneInfo TimeZone { get; } = FindTimeZone();

    private static TimeZoneInfo FindTimeZone()
    {
        // Older Windows ICU data uses the legacy IANA spelling; Windows also has a native ID.
        foreach (var id in new[] { TimeZoneId, "Europe/Kiev", "FLE Standard Time" })
            if (TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zone)) return zone;
        throw new TimeZoneNotFoundException("Kyiv timezone data is required to interpret cinema dates.");
    }

    public static DateTime ToUtc(DateOnly date, TimeOnly time) =>
        TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(time, DateTimeKind.Unspecified), TimeZone);

    public static (DateTime Start, DateTime End) DayBounds(DateOnly date) =>
        (ToUtc(date, TimeOnly.MinValue), ToUtc(date.AddDays(1), TimeOnly.MinValue));
}
