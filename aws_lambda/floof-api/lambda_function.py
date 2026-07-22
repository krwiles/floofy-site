import json
import datetime
import os

# NOTE: for lambda you must include the binaries AND ensure they are the linux versions not
import psycopg
from psycopg.rows import dict_row

def lambda_handler(event, context):
    method = event["requestContext"]["http"]["method"]
    
    if method == "GET":
        return get_reviews()
    elif method == "POST":
        return create_review(event)
    
    return response(405, {"message": "Method Not Allowed"})


def connect_to_db():
    return psycopg.connect(
        host=os.environ["DB_HOST"],
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        port=5432,
        sslmode="require",
    )


def get_reviews():
    # Query to fetch reviews without IP addresses and deleted reviews
    query = """
    SELECT
        id,
        author,
        comment,
        created_at
    FROM reviews
    WHERE deleted = FALSE
    ORDER BY created_at DESC
    """
    
    conn = connect_to_db()
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query)
        rows = cur.fetchall()

    conn.close()
    
    return response(200, rows)


def create_review(event):
    # Parse the request body
    body = json.loads(event["body"])
    author = body.get("author", "").strip()
    comment = body.get("comment", "").strip()
    ip_address = event["requestContext"]["http"]["sourceIp"]

    # Input validation
    if len(author) >= 50:
        return response(400, {"message": "Bad Request: author must be fewer than 50 characters"})
    if len(comment) >= 2000:
        return response(400, {"message": "Bad Request: comment must be fewer than 2000 characters"})

    # Query strings
    ip_query = """
    SELECT EXISTS (
        SELECT 1
        FROM blocked_ips
        WHERE ip_address = %s
    )
    """
    rate_limit_query = """
    SELECT COUNT(*)
    FROM reviews
    WHERE ip_address = %s 
        AND created_at >= NOW() - INTERVAL '1 hour'
    """
    insert_query = """
    INSERT INTO reviews (author, comment, ip_address)
    VALUES (%s, %s, %s)
    """
    
    conn = connect_to_db()
    with conn.cursor(row_factory=dict_row) as cur:
        # Check if the IP address is blocked
        cur.execute(ip_query, (ip_address,))
        result = cur.fetchone()
        if result and result["exists"]:
            conn.close()
            return response(403, {"message": "Internal Server Error"})

        # Check rate limit
        cur.execute(rate_limit_query, (ip_address,))
        result = cur.fetchone()
        if result and result["count"] > 0:
            conn.close()
            return response(429, {"message": "You have exceeded the limit of 1 comment per hour. Please try again later or contact the site administrator to request a change to your existing review."})

        # Insert the review
        cur.execute(insert_query, (author, comment, ip_address))
        conn.commit()
    
    conn.close()

    return response(201, {"message": "Review created successfully"})


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
        },
        "body": json.dumps(body, default=json_serializer)
    }


def json_serializer(obj):
    # Custom JSON serializer for datetime objects
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")