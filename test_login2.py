import sys
import os
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username FROM users WHERE username = 'pradnya.p.s' OR email = 'pradnya.p.s'")
            print("User found by lowercase:", cursor.fetchone())
except Exception as e:
    print(e)
