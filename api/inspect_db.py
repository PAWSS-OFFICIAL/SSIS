import os
from dotenv import load_dotenv
import pymysql

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

def inspect_db():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print("Tables:")
            for t in tables:
                table_name = list(t.values())[0]
                print(f"- {table_name}")
                cursor.execute(f"DESCRIBE {table_name}")
                desc = cursor.fetchall()
                for col in desc:
                    print(f"  {col['Field']}: {col['Type']}")
    finally:
        conn.close()

if __name__ == "__main__":
    inspect_db()
