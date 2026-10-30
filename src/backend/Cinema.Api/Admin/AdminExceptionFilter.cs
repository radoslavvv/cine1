using Cinema.Application.Admin;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Cinema.Api.Admin;

public sealed class AdminExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not AdminRuleException rule) return;
        var status = rule.Failure switch
        {
            AdminFailure.Validation => StatusCodes.Status400BadRequest,
            AdminFailure.NotFound => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status409Conflict
        };
        context.Result = new ObjectResult(new ProblemDetails { Title = rule.Message, Status = status }) { StatusCode = status };
        context.ExceptionHandled = true;
    }
}
