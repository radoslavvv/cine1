using CinemaR.Application.Admin.Results;

namespace CinemaR.Application.Admin.Exceptions;

public sealed class AdminRuleException(string message, AdminFailure failure = AdminFailure.Conflict) : Exception(message)
{
    public AdminFailure Failure { get; } = failure;
}
