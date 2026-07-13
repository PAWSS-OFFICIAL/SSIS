import sys
import os
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, name, email, idno FROM users WHERE name LIKE '%Pradnya%' OR username LIKE '%Pradnya%'")
            print("Users found:")
            for row in cursor.fetchall():
                print(row)
except Exception as e:
    print("Error:", e)
