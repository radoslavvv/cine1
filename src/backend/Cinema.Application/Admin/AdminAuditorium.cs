namespace Cinema.Application.Admin;

public sealed record AdminAuditorium(int Id, string Name, string[] SupportedFormats,
    bool IsRetired, bool LayoutLocked, bool IsUsed, IReadOnlyList<AdminSeat> Seats);
