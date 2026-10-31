using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Movies.Commands;
using CinemaR.Application.Auditoriums.Commands;
using CinemaR.Application.Showtimes.Commands;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Admin.Results;
using System.Globalization;
using CinemaR.Domain.Showtimes;

namespace CinemaR.Application.Admin.Validation;

public static class AdminValidation
{
    public static readonly string[] Formats = ["2D", "3D", "IMAX 2D", "IMAX 3D"];

    public static SaveMovieCommand Movie(SaveMovieCommand input)
    {
        if (string.IsNullOrWhiteSpace(input.Title) || input.Title.Trim().Length > 200
            || input.DurationMinutes is < 1 or > 1440 || input.Genres is null || input.Genres.Length is < 1 or > 20
            || input.Synopsis is null || input.Synopsis.Length > 10000)
        {
            throw new AdminRuleException("Enter a title, duration (1–1440 minutes), genres and synopsis within their limits.", AdminFailure.Validation);
        }

        var genres = input.Genres
            .Select(g => g?.Trim() ?? "")
            .Where(g => g.Length > 0)
            .Distinct()
            .ToArray();

        if (genres.Length == 0 || genres.Any(g => g.Length > 80))
        {
            throw new AdminRuleException("Enter at least one genre, with at most 80 characters per genre.", AdminFailure.Validation);
        }

        return input with
        {
            Title = input.Title.Trim(),
            Genres = genres,
            Synopsis = input.Synopsis.Trim(),
            PosterUrl = ImageUrl(input.PosterUrl),
            BackdropUrl = ImageUrl(input.BackdropUrl)
        };
    }

    private static string? ImageUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        value = value.Trim();

        if (value.Length > 2048)
        {
            throw new AdminRuleException("Image URLs must be at most 2048 characters.", AdminFailure.Validation);
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https") || !string.IsNullOrEmpty(uri.UserInfo))
        {
            throw new AdminRuleException("Image URLs must be absolute HTTP or HTTPS URLs without credentials.", AdminFailure.Validation);
        }

        return value;
    }

    public static SaveAuditoriumCommand Auditorium(SaveAuditoriumCommand input)
    {
        if (string.IsNullOrWhiteSpace(input.Name) || input.Name.Trim().Length > 100
            || input.Rows is < 1 or > 26 || input.SeatsPerRow is < 1 or > 40
            || input.SupportedFormats is null || input.SupportedFormats.Length is < 1 or > 4)
        {
            throw new AdminRuleException("Enter an auditorium name, valid seat dimensions and supported formats.", AdminFailure.Validation);
        }

        if (input.SupportedFormats.Any(f => !Formats.Contains(f)))
        {
            throw new AdminRuleException("Choose supported cinema formats.", AdminFailure.Validation);
        }

        return input with
        {
            Name = input.Name.Trim(),
            SupportedFormats = input.SupportedFormats
                .Distinct()
                .ToArray()
        };
    }

    public static DateOnly Date(string value)
    {
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            || date.Year is < 1900 or > 9998)
        {
            throw new AdminRuleException("Use a date in YYYY-MM-DD format (1900–9998).", AdminFailure.Validation);
        }

        return date;
    }

    public static DateTime[] Starts(SaveShowtimesCommand input)
    {
        if (input.MovieId <= 0 || input.AuditoriumId <= 0 || input.Dates is null || input.Dates.Length is < 1 or > 366)
        {
            throw new AdminRuleException("Choose a movie, auditorium and between one and 366 screening dates.", AdminFailure.Validation);
        }

        if (!Formats.Contains(input.Format) || !TimeOnly.TryParseExact(input.LocalTime, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out var time))
        {
            throw new AdminRuleException("Choose a cinema format and a local start time in HH:mm format.", AdminFailure.Validation);
        }

        return input.Dates
            .Select(Date)
            .Distinct()
            .Order()
            .Select(date =>
        {
            var local = date.ToDateTime(time, DateTimeKind.Unspecified);

            if (CinemaCalendar.TimeZone.IsInvalidTime(local) || CinemaCalendar.TimeZone.IsAmbiguousTime(local))
            {
                throw new AdminRuleException($"{date:yyyy-MM-dd} {time:HH:mm} is skipped or occurs twice because of the Kyiv clock change. Choose another time.", AdminFailure.Validation);
            }

            return CinemaCalendar.ToUtc(date, time);
        })
            .ToArray();
    }
}
