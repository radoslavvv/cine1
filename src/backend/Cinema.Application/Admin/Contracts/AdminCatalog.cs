namespace Cinema.Application.Admin.Contracts;

public sealed record AdminCatalog(IReadOnlyList<AdminMovie> Movies, IReadOnlyList<AdminAuditorium> Auditoriums);
