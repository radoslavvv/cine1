using System.Globalization;
using Cinema.Api.Schedule;

namespace Cinema.Api.Admin;

public static class AdminValidation
{
    public static readonly string[] Formats = ["2D", "3D", "IMAX 2D", "IMAX 3D"];

    public static MovieInput Movie(MovieInput input)
    {
        var genres = input.Genres.Select(g => g?.Trim() ?? "").Where(g => g.Length > 0).Distinct().ToArray();
        if (genres.Length == 0 || genres.Any(g => g.Length > 80))
            throw new AdminRuleException("Enter at least one genre, with at most 80 characters per genre.", 400);
        return input with { Title = input.Title.Trim(), Genres = genres,
            Synopsis = input.Synopsis.Trim(), PosterUrl = ImageUrl(input.PosterUrl), BackdropUrl = ImageUrl(input.BackdropUrl) };
    }

    private static string? ImageUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        value = value.Trim();
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https") || !string.IsNullOrEmpty(uri.UserInfo))
            throw new AdminRuleException("Image URLs must be absolute HTTP or HTTPS URLs without credentials.", 400);
        return value;
    }

    public static AuditoriumInput Auditorium(AuditoriumInput input)
    {
        if (input.SupportedFormats.Any(f => !Formats.Contains(f)))
            throw new AdminRuleException("Choose supported cinema formats.", 400);
        return input with { Name = input.Name.Trim(), SupportedFormats = input.SupportedFormats.Distinct().ToArray() };
    }

    public static DateOnly Date(string value)
    {
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            || date.Year is < 1900 or > 9998)
            throw new AdminRuleException("Use a date in YYYY-MM-DD format (1900–9998).", 400);
        return date;
    }

    public static DateTime[] Starts(ShowtimeInput input)
    {
        if (!Formats.Contains(input.Format) || !TimeOnly.TryParseExact(input.LocalTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
            throw new AdminRuleException("Choose a cinema format and a local start time in HH:mm format.", 400);
        return input.Dates.Select(Date).Distinct().Order().Select(date =>
        {
            var local = date.ToDateTime(time, DateTimeKind.Unspecified);
            if (CinemaCalendar.TimeZone.IsInvalidTime(local) || CinemaCalendar.TimeZone.IsAmbiguousTime(local))
                throw new AdminRuleException($"{date:yyyy-MM-dd} {time:HH:mm} is skipped or occurs twice because of the Kyiv clock change. Choose another time.", 400);
            return CinemaCalendar.ToUtc(date, time);
        }).ToArray();
    }
}
