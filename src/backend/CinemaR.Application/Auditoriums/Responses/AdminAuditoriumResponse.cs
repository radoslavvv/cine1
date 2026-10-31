namespace CinemaR.Application.Auditoriums.Responses;

public sealed record AdminAuditoriumResponse(int Id, string Name, string[] SupportedFormats,
    bool IsRetired, bool LayoutLocked, bool IsUsed, IReadOnlyList<AdminSeatResponse> Seats);
