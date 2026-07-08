import pymysql
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': {}},
}

def apply_fixes():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            print("Applying schema fixes...")
            # Alter submissions table to add missing columns
            try:
                cursor.execute("ALTER TABLE submissions ADD COLUMN classwork_id VARCHAR(255) NULL;")
                print("Added classwork_id to submissions.")
            except Exception as e:
                pass
            
            try:
                cursor.execute("ALTER TABLE submissions ADD COLUMN content LONGTEXT NULL;")
                print("Added content to submissions.")
            except Exception as e:
                pass
            
            try:
                cursor.execute("ALTER TABLE submissions ADD COLUMN code_submitted LONGTEXT NULL;")
            except Exception: pass
            
            try:
                cursor.execute("ALTER TABLE submissions ADD COLUMN output LONGTEXT NULL;")
            except Exception: pass
            
            try:
                cursor.execute("ALTER TABLE submissions ADD COLUMN marks_obtained INT NULL;")
            except Exception: pass
            
            try:
                cursor.execute("ALTER TABLE submissions ADD COLUMN status VARCHAR(50) DEFAULT 'submitted';")
            except Exception: pass
            
            # Create webhooks table if not exists
            try:
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS webhooks (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    url VARCHAR(255) NOT NULL,
                    events JSON NOT NULL,
                    secret VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by VARCHAR(255)
                )
                """)
                print("Checked webhooks table.")
            except Exception as e:
                print(f"Error creating webhooks: {e}")
            
            conn.commit()
            print("Schema fixes applied successfully!")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_fixes()
