import sys
import os
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, idno FROM users WHERE role = 'Student' LIMIT 10")
            print("Students:")
            for row in cursor.fetchall():
                print(row)
except Exception as e:
    print(e)
