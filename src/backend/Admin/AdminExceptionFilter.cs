using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Cinema.Api.Admin;

public sealed class AdminExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        var rule = context.Exception as AdminRuleException;
        var postgres = (context.Exception as DbUpdateException)?.InnerException as PostgresException;
        var title = rule?.Message ?? postgres?.SqlState switch
        {
            PostgresErrorCodes.ExclusionViolation => "A screening conflicts with this auditorium's schedule. Nothing was saved; refresh and adjust the dates.",
            PostgresErrorCodes.UniqueViolation => "This name or seat layout already exists. Nothing was saved.",
            PostgresErrorCodes.ForeignKeyViolation => "This record is in use and cannot be deleted.",
            _ => null
        };
        if (title is null) return;
        context.Result = new ObjectResult(new ProblemDetails { Title = title, Status = rule?.Status ?? 409 }) { StatusCode = rule?.Status ?? 409 };
        context.ExceptionHandled = true;
    }
}
