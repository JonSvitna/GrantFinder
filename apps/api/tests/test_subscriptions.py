from app.services.subscriptions import FOUNDER_CAP, active_founder_count, spots_remaining


def test_founder_cap_constant():
    assert FOUNDER_CAP == 50


def test_spots_remaining_when_empty():
    assert spots_remaining(0) == 50


def test_spots_remaining_when_full():
    assert spots_remaining(50) == 0


def test_active_founder_count_empty_db(test_db):
    db = test_db()
    try:
        assert active_founder_count(db) == 0
    finally:
        db.close()
