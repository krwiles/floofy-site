import psycopg

import db


def test_connect_to_db_gives_up_before_the_lambda_is_cut_off(monkeypatch):
    # Arrange: capture what psycopg.connect is called with, instead of opening a real connection.
    captured = {}
    monkeypatch.setattr(psycopg, "connect", lambda **kwargs: captured.update(kwargs))
    for name in ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"):
        monkeypatch.setenv(name, "test")

    # Act: open a connection.
    db.connect_to_db()

    # Assert: an 8 second connect timeout, well inside the 30 second Lambda limit.
    assert captured["connect_timeout"] == db.DB_CONNECT_TIMEOUT_SECONDS == 8
