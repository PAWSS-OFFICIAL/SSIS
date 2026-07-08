import os
import pymysql
from dotenv import load_dotenv
from pathlib import Path

# Load config
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
load_dotenv(ROOT_DIR / 'api' / '.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': {}},
    'cursorclass': pymysql.cursors.DictCursor
}

def check_schema():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            tables = ['users', 'quizzes', 'questions', 'submissions', 'departments', 'courses']
            for table in tables:
                print(f"\n--- Schema for table: {table} ---")
                try:
                    cursor.execute(f"DESCRIBE {table}")
                    for row in cursor.fetchall():
                        print(f"{row['Field']}: {row['Type']} (Null: {row['Null']}, Key: {row['Key']})")
                except Exception as e:
                    print(f"Table {table} not found or error: {e}")
            
            print("\n--- Checking for NextGen tables ---")
            nextgen_tables = ['submissions_ai', 'drafts_autosave', 'tab_switch_logs']
            for table in nextgen_tables:
                cursor.execute(f"SHOW TABLES LIKE '{table}'")
                res = cursor.fetchone()
                print(f"Table {table}: {'EXISTS' if res else 'MISSING'}")
                
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
