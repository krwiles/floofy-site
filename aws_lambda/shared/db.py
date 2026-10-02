"""The Neon Postgres connection, shared by every Lambda that reads or writes the database."""

import os

# NOTE: the Lambda zip must contain psycopg's *Linux* binary — build it with build.sh, not a plain pip install.
import psycopg

# Give up on a slow or sleeping Neon well inside the Lambda's 30 s limit, so the failure is logged and answered
DB_CONNECT_TIMEOUT_SECONDS = 8


def connect_to_db():
    """Open a new TLS connection to Neon using the DB_* environment variables."""
    return psycopg.connect(
        host=os.environ["DB_HOST"],
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        port=5432,
        sslmode="require",
        connect_timeout=DB_CONNECT_TIMEOUT_SECONDS,
    )
