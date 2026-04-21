import pytest
import yaml
from datetime import datetime, timedelta, timezone
from pathlib import Path
from fastapi.testclient import TestClient

from main import create_app
from store import fresh_store


@pytest.fixture()
def client():
    s = fresh_store()
    app = create_app(store=s)
    return TestClient(app), s


@pytest.fixture()
def openapi_spec():
    spec_path = Path(__file__).parent.parent / "typespec" / "tsp-output" / "openapi" / "openapi.yaml"
    with open(spec_path) as f:
        return yaml.safe_load(f)


class TestContractCompliance:
    def test_all_paths_in_openapi_exist_in_backend(self, openapi_spec, client):
        c, s = client
        seed(s)
        for path, methods in openapi_spec["paths"].items():
            for method in methods:
                if method == "parameters":
                    continue
                if method.lower() == "delete":
                    continue
                test_path = path.replace("{id}", "meeting-15")
                r = getattr(c, method.lower())(test_path)
                assert r.status_code != 404, f"Endpoint {method.upper()} {path} returns 404"

    def test_delete_endpoint_exists(self, openapi_spec, client):
        c, s = client
        from models import EventType
        s["event_types"]["temp-del"] = EventType(id="temp-del", title="T", description="D", duration=10)
        r = c.delete("/admin/event-types/temp-del")
        assert r.status_code == 204

    def test_error_response_format(self, client):
        c, _ = client
        r = c.get("/admin/event-types/nonexistent")
        assert r.status_code == 404
        body = r.json()
        assert "code" in body, "Error response must have 'code' at top level"
        assert "message" in body, "Error response must have 'message' at top level"
        assert "detail" not in body, "Error response must NOT be wrapped in 'detail'"

    def test_post_booking_status_code(self, client):
        c, s = client
        from models import EventType
        s["event_types"]["meeting-15"] = EventType(
            id="meeting-15", title="T", description="D", duration=15,
        )
        future = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
        r = c.post("/bookings", json={
            "eventTypeId": "meeting-15",
            "startAt": future.isoformat(),
            "guestName": "A",
            "guestEmail": "a@t.com",
        })
        assert r.status_code == 200, f"POST /bookings should return 200 per contract, got {r.status_code}"

    def test_post_event_type_status_code(self, client):
        c, _ = client
        r = c.post("/admin/event-types", json={
            "id": "new-type",
            "title": "T",
            "description": "D",
            "duration": 30,
        })
        assert r.status_code == 200, f"POST /admin/event-types should return 200 per contract, got {r.status_code}"

    def test_delete_event_type_204(self, client):
        c, s = client
        from models import EventType
        s["event_types"]["temp"] = EventType(id="temp", title="T", description="D", duration=10)
        r = c.delete("/admin/event-types/temp")
        assert r.status_code == 204

    def test_error_codes_match_contract(self, client):
        c, _ = client
        r = c.get("/event-types/nonexistent/slots")
        assert r.status_code == 404
        assert r.json()["code"] == "NOT_FOUND"

        r2 = c.post("/bookings", json={
            "eventTypeId": "nonexistent",
            "startAt": "2026-01-01T10:00:00",
            "guestName": "A",
            "guestEmail": "a@t.com",
        })
        assert r2.status_code == 404


def seed(s):
    from store import seed_data as _seed
    _seed.__code__  # just reference
    # inline seed to avoid global state
    from models import EventType
    s["event_types"]["meeting-15"] = EventType(
        id="meeting-15", title="Встреча 15 минут",
        description="Короткий тип события для быстрого слота.", duration=15,
    )
    s["event_types"]["meeting-30"] = EventType(
        id="meeting-30", title="Встреча 30 минут",
        description="Стандартная встреча для обсуждения деталей.", duration=30,
    )


# --- Public event types ---

def test_list_event_types_empty(client):
    c, _ = client
    r = c.get("/event-types")
    assert r.status_code == 200
    assert r.json() == []


def test_list_event_types_seeded(client):
    c, s = client
    seed(s)
    r = c.get("/event-types")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
    assert {et["id"] for et in data} == {"meeting-15", "meeting-30"}


# --- Admin event types CRUD ---

def test_admin_create_event_type(client):
    c, s = client
    r = c.post("/admin/event-types", json={
        "id": "consultation",
        "title": "Консультация",
        "description": "Индивидуальная консультация",
        "duration": 60,
    })
    assert r.status_code == 200
    assert r.json()["id"] == "consultation"
    assert "consultation" in s["event_types"]


def test_admin_create_duplicate_event_type(client):
    c, s = client
    seed(s)
    r = c.post("/admin/event-types", json={
        "id": "meeting-15",
        "title": "Dup",
        "description": "Dup",
        "duration": 10,
    })
    assert r.status_code == 409
    assert r.json()["code"] == "CONFLICT"


def test_admin_get_event_type(client):
    c, s = client
    seed(s)
    r = c.get("/admin/event-types/meeting-15")
    assert r.status_code == 200
    assert r.json()["id"] == "meeting-15"


def test_admin_get_event_type_not_found(client):
    c, _ = client
    r = c.get("/admin/event-types/nonexistent")
    assert r.status_code == 404


def test_admin_update_event_type(client):
    c, s = client
    seed(s)
    r = c.put("/admin/event-types/meeting-15", json={
        "title": "Updated",
        "description": "Updated desc",
        "duration": 20,
    })
    assert r.status_code == 200
    assert r.json()["title"] == "Updated"
    assert s["event_types"]["meeting-15"].title == "Updated"


def test_admin_update_not_found(client):
    c, _ = client
    r = c.put("/admin/event-types/nonexistent", json={
        "title": "X", "description": "X", "duration": 10,
    })
    assert r.status_code == 404


def test_admin_delete_event_type(client):
    c, s = client
    seed(s)
    r = c.delete("/admin/event-types/meeting-15")
    assert r.status_code == 204
    assert "meeting-15" not in s["event_types"]


def test_admin_delete_not_found(client):
    c, _ = client
    r = c.delete("/admin/event-types/nonexistent")
    assert r.status_code == 404


# --- Slots ---

def test_get_slots_not_found(client):
    c, _ = client
    r = c.get("/event-types/nonexistent/slots")
    assert r.status_code == 404


def test_get_slots_returns_slots(client):
    c, s = client
    seed(s)
    r = c.get("/event-types/meeting-15/slots")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert all("startAt" in sl and "endAt" in sl and "isAvailable" in sl for sl in data)


def test_slots_are_within_work_hours(client):
    c, s = client
    seed(s)
    r = c.get("/event-types/meeting-15/slots")
    for sl in r.json():
        hour = datetime.fromisoformat(sl["startAt"]).hour
        assert 9 <= hour < 18


def test_slots_weekdays_only(client):
    c, s = client
    seed(s)
    r = c.get("/event-types/meeting-15/slots")
    for sl in r.json():
        wd = datetime.fromisoformat(sl["startAt"]).weekday()
        assert wd < 5  # Mon=0 .. Fri=4


# --- Bookings ---

def test_create_booking(client):
    c, s = client
    seed(s)
    future = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    r = c.post("/bookings", json={
        "eventTypeId": "meeting-15",
        "startAt": future.isoformat(),
        "guestName": "Alice",
        "guestEmail": "alice@test.com",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["guestName"] == "Alice"
    assert data["eventTypeId"] == "meeting-15"
    assert len(s["bookings"]) == 1


def test_create_booking_not_found(client):
    c, _ = client
    future = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    r = c.post("/bookings", json={
        "eventTypeId": "nonexistent",
        "startAt": future.isoformat(),
        "guestName": "Alice",
        "guestEmail": "alice@test.com",
    })
    assert r.status_code == 404


def test_create_booking_past(client):
    c, s = client
    seed(s)
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    r = c.post("/bookings", json={
        "eventTypeId": "meeting-15",
        "startAt": past.isoformat(),
        "guestName": "Alice",
        "guestEmail": "alice@test.com",
    })
    assert r.status_code == 400
    assert r.json()["code"] == "BAD_REQUEST"


def test_create_booking_beyond_window(client):
    c, s = client
    seed(s)
    far = datetime.now(timezone.utc) + timedelta(days=30)
    r = c.post("/bookings", json={
        "eventTypeId": "meeting-15",
        "startAt": far.isoformat(),
        "guestName": "Alice",
        "guestEmail": "alice@test.com",
    })
    assert r.status_code == 400


def test_double_booking_conflict(client):
    c, s = client
    seed(s)
    future = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    payload = {
        "eventTypeId": "meeting-15",
        "startAt": future.isoformat(),
        "guestName": "Alice",
        "guestEmail": "alice@test.com",
    }
    r1 = c.post("/bookings", json=payload)
    assert r1.status_code == 200

    payload["guestName"] = "Bob"
    payload["guestEmail"] = "bob@test.com"
    r2 = c.post("/bookings", json=payload)
    assert r2.status_code == 409
    assert r2.json()["code"] == "CONFLICT"


def test_same_slot_different_event_type_ok(client):
    c, s = client
    seed(s)
    future = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    r1 = c.post("/bookings", json={
        "eventTypeId": "meeting-15",
        "startAt": future.isoformat(),
        "guestName": "Alice",
        "guestEmail": "alice@test.com",
    })
    assert r1.status_code == 200

    r2 = c.post("/bookings", json={
        "eventTypeId": "meeting-30",
        "startAt": future.isoformat(),
        "guestName": "Bob",
        "guestEmail": "bob@test.com",
    })
    assert r2.status_code == 200


# --- Admin bookings ---

def test_admin_list_bookings_empty(client):
    c, _ = client
    r = c.get("/admin/bookings")
    assert r.status_code == 200
    assert r.json() == []


def test_admin_list_bookings_sorted(client):
    c, s = client
    seed(s)
    t1 = (datetime.now(timezone.utc) + timedelta(days=2)).replace(hour=10, minute=0, second=0, microsecond=0)
    t2 = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    c.post("/bookings", json={"eventTypeId": "meeting-15", "startAt": t1.isoformat(), "guestName": "A", "guestEmail": "a@t.com"})
    c.post("/bookings", json={"eventTypeId": "meeting-15", "startAt": t2.isoformat(), "guestName": "B", "guestEmail": "b@t.com"})
    r = c.get("/admin/bookings")
    data = r.json()
    assert len(data) == 2
    assert data[0]["guestName"] == "A"  # later date first (reverse=True)
    assert data[1]["guestName"] == "B"


def test_slot_becomes_unavailable_after_booking(client):
    c, s = client
    seed(s)
    future = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
    c.post("/bookings", json={
        "eventTypeId": "meeting-15",
        "startAt": future.isoformat(),
        "guestName": "Alice",
        "guestEmail": "alice@test.com",
    })
    r = c.get("/event-types/meeting-15/slots")
    booked = [sl for sl in r.json() if datetime.fromisoformat(sl["startAt"]) == future]
    assert len(booked) == 1
    assert booked[0]["isAvailable"] is False
