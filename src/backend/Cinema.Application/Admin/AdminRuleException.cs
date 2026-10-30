namespace Cinema.Application.Admin;

public sealed class AdminRuleException(string message, AdminFailure failure = AdminFailure.Conflict) : Exception(message)
{
    public AdminFailure Failure { get; } = failure;
}
