import sys
import os
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, role FROM users WHERE id = 1 OR role = 'Admin' OR role = 'admin' LIMIT 5")
            rows = cursor.fetchall()
            for r in rows:
                print(r)
except Exception as e:
    print(e)
