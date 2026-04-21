import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import NoReturn

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from models import (
    EventType,
    CreateEventTypeRequest,
    UpdateEventTypeRequest,
    Booking,
    CreateBookingRequest,
    Slot,
    Error,
)

AVAILABILITY_DAYS: int = 14
WORK_HOUR_START: int = 9
WORK_HOUR_END: int = 18
SLOT_INTERVAL_MINUTES: int = 15


def create_app(store: dict | None = None) -> FastAPI:
    if store is None:
        from store import event_types, bookings, seed_data
        seed_data()
        et_store: dict[str, EventType] = event_types
        b_store: list[Booking] = bookings
    else:
        et_store = store["event_types"]
        b_store = store["bookings"]

    app = FastAPI(title="Calendar Booking API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail if isinstance(exc.detail, dict) else {"code": "ERROR", "message": str(exc.detail)},
        )

    def _build_event_type(id: str, title: str, description: str, duration: int) -> EventType:
        return EventType(id=id, title=title, description=description, duration=duration)

    def _generate_slots(event_type: EventType) -> list[Slot]:
        now = datetime.now(timezone.utc)
        end_window = now + timedelta(days=AVAILABILITY_DAYS)

        slots: list[Slot] = []
        current = now.replace(minute=0, second=0, microsecond=0)
        if current <= now:
            current += timedelta(hours=1)

        while current < end_window:
            if current.weekday() < 5 and WORK_HOUR_START <= current.hour < WORK_HOUR_END:
                slot_end = current + timedelta(minutes=event_type.duration)
                if slot_end.hour > WORK_HOUR_END or (slot_end.hour == WORK_HOUR_END and slot_end.minute > 0):
                    current += timedelta(minutes=SLOT_INTERVAL_MINUTES)
                    continue

                is_booked = any(
                    b.eventTypeId == event_type.id and b.startAt < slot_end and b.endAt > current
                    for b in b_store
                )
                slots.append(
                    Slot(
                        startAt=current,
                        endAt=slot_end,
                        isAvailable=not is_booked,
                    )
                )
            current += timedelta(minutes=SLOT_INTERVAL_MINUTES)

        return slots

    def _error(code: str, message: str, status_code: int) -> NoReturn:
        raise HTTPException(status_code=status_code, detail=Error(code=code, message=message).model_dump())

    @app.get("/admin/event-types", response_model=list[EventType], tags=["Owner"])
    def list_event_types_admin() -> list[EventType]:
        return list(et_store.values())

    @app.get("/admin/event-types/{id}", response_model=EventType, tags=["Owner"])
    def get_event_type_admin(id: str) -> EventType:
        if id not in et_store:
            _error("NOT_FOUND", f"Event type '{id}' not found", 404)
        return et_store[id]

    @app.post("/admin/event-types", response_model=EventType, tags=["Owner"])
    def create_event_type_admin(body: CreateEventTypeRequest) -> EventType:
        if body.id in et_store:
            _error("CONFLICT", f"Event type '{body.id}' already exists", 409)
        event_type = _build_event_type(body.id, body.title, body.description, body.duration)
        et_store[body.id] = event_type
        return event_type

    @app.put("/admin/event-types/{id}", response_model=EventType, tags=["Owner"])
    def update_event_type_admin(id: str, body: UpdateEventTypeRequest) -> EventType:
        if id not in et_store:
            _error("NOT_FOUND", f"Event type '{id}' not found", 404)
        et_store[id] = _build_event_type(id, body.title, body.description, body.duration)
        return et_store[id]

    @app.delete("/admin/event-types/{id}", status_code=204, tags=["Owner"])
    def delete_event_type_admin(id: str) -> None:
        if id not in et_store:
            _error("NOT_FOUND", f"Event type '{id}' not found", 404)
        del et_store[id]

    @app.get("/admin/bookings", response_model=list[Booking], tags=["Owner"])
    def list_bookings_admin() -> list[Booking]:
        return sorted(b_store, key=lambda b: b.startAt, reverse=True)

    @app.get("/event-types", response_model=list[EventType], tags=["Guest"])
    def list_event_types_public() -> list[EventType]:
        return list(et_store.values())

    @app.get("/event-types/{id}/slots", response_model=list[Slot], tags=["Guest"])
    def get_available_slots(id: str) -> list[Slot]:
        if id not in et_store:
            _error("NOT_FOUND", f"Event type '{id}' not found", 404)
        return _generate_slots(et_store[id])

    @app.post("/bookings", response_model=Booking, tags=["Guest"])
    def create_booking(body: CreateBookingRequest) -> Booking:
        if body.eventTypeId not in et_store:
            _error("NOT_FOUND", f"Event type '{body.eventTypeId}' not found", 404)

        event_type = et_store[body.eventTypeId]
        end_at = body.startAt + timedelta(minutes=event_type.duration)

        now = datetime.now(timezone.utc)
        if body.startAt < now:
            _error("BAD_REQUEST", "Cannot book in the past", 400)
        if body.startAt > now + timedelta(days=AVAILABILITY_DAYS):
            _error("BAD_REQUEST", f"Booking window is {AVAILABILITY_DAYS} days", 400)

        for booking in b_store:
            if booking.eventTypeId == body.eventTypeId and booking.startAt < end_at and booking.endAt > body.startAt:
                _error("CONFLICT", "This slot is already booked", 409)

        booking = Booking(
            id=str(uuid.uuid4()),
            eventTypeId=body.eventTypeId,
            eventTitle=event_type.title,
            startAt=body.startAt,
            endAt=end_at,
            guestName=body.guestName,
            guestEmail=body.guestEmail,
        )
        b_store.append(booking)
        return booking

    return app


app = create_app()

STATIC_DIR = Path(__file__).parent / "dist"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str) -> FileResponse:
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        raise HTTPException(status_code=404, detail=Error(code="NOT_FOUND", message="Frontend not built").model_dump())
