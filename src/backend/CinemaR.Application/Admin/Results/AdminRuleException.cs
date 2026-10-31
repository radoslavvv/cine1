namespace CinemaR.Application.Admin.Results;

public sealed class AdminRuleException(string message, AdminFailure failure = AdminFailure.Conflict) : Exception(message)
{
    public AdminFailure Failure { get; } = failure;
}
