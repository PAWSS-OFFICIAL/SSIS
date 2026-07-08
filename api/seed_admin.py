import os
import bcrypt
import pymysql
from dotenv import load_dotenv

load_dotenv('.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': {}},
    'cursorclass': pymysql.cursors.DictCursor
}

def seed_admin():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            # Check if admin already exists
            cursor.execute("SELECT id FROM users WHERE username = 'admin'")
            admin_user = cursor.fetchone()

            password = "1234567890"
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            if admin_user:
                cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, admin_user['id']))
                print("Admin user 'admin' already existed. Password updated to 1234567890.")
            else:
                cursor.execute("""
                    INSERT INTO users (username, email, password, role, name) 
                    VALUES (%s, %s, %s, %s, %s)
                """, ('admin', 'admin@example.com', hashed_password, 'Admin', 'System Administrator'))
                print("Successfully seeded admin user (username: admin, password: 1234567890)")
            
            conn.commit()
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_admin()
