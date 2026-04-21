from models import EventType, Booking

event_types: dict[str, EventType] = {}
bookings: list[Booking] = []


def seed_data():
    event_types["meeting-15"] = EventType(
        id="meeting-15",
        title="Встреча 15 минут",
        description="Короткий тип события для быстрого слота.",
        duration=15,
    )
    event_types["meeting-30"] = EventType(
        id="meeting-30",
        title="Встреча 30 минут",
        description="Стандартная встреча для обсуждения деталей.",
        duration=30,
    )


def fresh_store():
    return {"event_types": {}, "bookings": []}
