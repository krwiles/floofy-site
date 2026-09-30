"""The Neon Postgres connection, shared by every Lambda that reads or writes the database."""

import os

# NOTE: the Lambda zip must contain psycopg's *Linux* binary — build it with build.sh, not a plain pip install.
import psycopg


def connect_to_db():
    """Open a new TLS connection to Neon using the DB_* environment variables."""
    return psycopg.connect(
        host=os.environ["DB_HOST"],
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        port=5432,
        sslmode="require",
    )
