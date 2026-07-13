import sys
import os
import bcrypt
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, name, email, idno, password FROM users WHERE id = 90001")
            user = cursor.fetchone()
            print("User:")
            print({k: v for k, v in user.items() if k != 'password'})
            
            # Test passwords
            test_passwords = [
                "SSIS20263",
                "SSIS2026SSIS20263",
                "ssis20263",
                "Pradnya.P.S",
                "pradnya.p.s"
            ]
            
            for pw in test_passwords:
                match = bcrypt.checkpw(pw.encode('utf-8'), user['password'].encode('utf-8'))
                print(f"Password '{pw}': Match? {match}")
except Exception as e:
    print("Error:", e)
