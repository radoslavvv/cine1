
namespace CinemaR.Application.Booking.Responses;

public sealed record BookingHistoryResponse(BookingConfirmationResponse[] Items, int Page, bool HasMore);
