import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Rest.Resource;
using TypeSpec.OpenAPI;

@service(#{
  title: "Calendar Booking API",
})
@summary("API for managing calendar bookings. Supports owner (admin) and guest (public) scenarios.")
@server("http://localhost:3000", "Development server")
namespace CalendarBooking;

// ============ Models ============

model EventType {
  @example("meeting-15") id: string;
  @example("Встреча 15 минут") title: string;
  @example("Короткий тип события для быстрого слота.") description: string;
  @example(15) duration: int32;
}

model CreateEventTypeRequest {
  id: string;
  title: string;
  description: string;
  duration: int32;
}

model UpdateEventTypeRequest {
  title: string;
  description: string;
  duration: int32;
}

model Booking {
  id: string;
  eventTypeId: string;
  eventTitle: string;
  startAt: utcDateTime;
  endAt: utcDateTime;
  guestName: string;
  guestEmail: string;
}

model CreateBookingRequest {
  eventTypeId: string;
  startAt: utcDateTime;
  guestName: string;
  guestEmail: string;
}

model Slot {
  startAt: utcDateTime;
  endAt: utcDateTime;
  isAvailable: boolean;
}

model Error {
  code: string;
  message: string;
}

// ============ Owner (Admin) Routes ============

@route("/admin/event-types")
@tag("Owner")
namespace EventTypesAdmin {

  @get
  op listEventTypes(): EventType[] | ErrorResponse;

  @get
  op getEventType(@path id: string): EventType | ErrorResponse;

  @post
  op createEventType(@body body: CreateEventTypeRequest): EventType | ErrorResponse;

  @put
  op updateEventType(@path id: string, @body body: UpdateEventTypeRequest): EventType | ErrorResponse;

  @delete
  op deleteEventType(@path id: string): void | ErrorResponse;
}

@route("/admin/bookings")
@tag("Owner")
namespace BookingsAdmin {

  @get
  op listBookings(): Booking[] | ErrorResponse;
}

// ============ Guest (Public) Routes ============

@route("/event-types")
@tag("Guest")
namespace EventTypesPublic {

  @get
  op listEventTypes(): EventType[] | ErrorResponse;
}

@route("/event-types/{id}/slots")
@tag("Guest")
namespace Slots {

  @get
  op getAvailableSlots(@path id: string): Slot[] | ErrorResponse;
}

@route("/bookings")
@tag("Guest")
namespace BookingsPublic {

  @post
  op createBooking(@body body: CreateBookingRequest): Booking | ErrorResponse;
}

// ============ Error Response ============

alias ErrorResponse = {
  @statusCode
  status: 400 | 404 | 409,
  @body
  body: Error,
};
