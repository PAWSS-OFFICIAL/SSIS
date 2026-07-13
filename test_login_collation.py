import sys
import os
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username FROM users WHERE username = 'Pradnya.P.S' OR email = 'Pradnya.P.S'")
            user = cursor.fetchone()
            print("User found by exact identifier 'Pradnya.P.S':", user)
except Exception as e:
    print("Error:", e)
