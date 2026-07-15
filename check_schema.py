import sys
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DESCRIBE users")
            for row in cursor.fetchall():
                print(row)
except Exception as e:
    print(e)
