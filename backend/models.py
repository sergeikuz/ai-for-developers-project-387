from pydantic import BaseModel
from datetime import datetime


class EventType(BaseModel):
    id: str
    title: str
    description: str
    duration: int


class CreateEventTypeRequest(BaseModel):
    id: str
    title: str
    description: str
    duration: int


class UpdateEventTypeRequest(BaseModel):
    title: str
    description: str
    duration: int


class Booking(BaseModel):
    id: str
    eventTypeId: str
    eventTitle: str
    startAt: datetime
    endAt: datetime
    guestName: str
    guestEmail: str


class CreateBookingRequest(BaseModel):
    eventTypeId: str
    startAt: datetime
    guestName: str
    guestEmail: str


class Slot(BaseModel):
    startAt: datetime
    endAt: datetime
    isAvailable: bool


class Error(BaseModel):
    code: str
    message: str
