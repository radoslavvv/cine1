namespace Cinema.Application.Admin;

public sealed record SaveAuditoriumCommand(
    string Name,
    int Rows, int SeatsPerRow,
    string[] SupportedFormats,
    bool ReplaceLayout = false);
