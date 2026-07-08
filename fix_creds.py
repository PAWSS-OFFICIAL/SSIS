import os
import pymysql
import bcrypt
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path('api')
load_dotenv(ROOT_DIR / '.env')

DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USERNAME')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_DATABASE')
DB_PORT = int(os.environ.get('DB_PORT', 4000))

def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        ssl={'ssl': {'ca': '/etc/ssl/cert.pem'}}
    )

def fix_creds_and_schema():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Reset Admin Password
            print("Resetting admin password to '123456789'...")
            hashed = bcrypt.hashpw("123456789".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("UPDATE users SET password = %s WHERE username = 'admin'", (hashed,))
            
            # 2. Fix Submissions Table (Rename or Add submission_id)
            print("Checking submissions table schema...")
            cursor.execute("DESCRIBE submissions")
            columns = [row['Field'] for row in cursor.fetchall()]
            
            if 'submission_id' not in columns:
                print("Adding submission_id to submissions table...")
                # If 'id' is PRI, we might want to keep it or replace it. 
                # The schema expects VARCHAR(36) PRIMARY KEY for submission_id.
                try:
                    cursor.execute("ALTER TABLE submissions ADD COLUMN submission_id VARCHAR(36) AFTER id")
                    cursor.execute("UPDATE submissions SET submission_id = UUID() WHERE submission_id IS NULL")
                except Exception as e:
                    print(f"Error altering table: {e}")
            
            conn.commit()
            print("Done.")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_creds_and_schema()
