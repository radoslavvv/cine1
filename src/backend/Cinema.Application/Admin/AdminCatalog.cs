namespace Cinema.Application.Admin;

public sealed record AdminCatalog(IReadOnlyList<AdminMovie> Movies, IReadOnlyList<AdminAuditorium> Auditoriums);
