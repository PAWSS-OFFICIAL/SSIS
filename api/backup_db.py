import os
from dotenv import load_dotenv
import pymysql
import json
from datetime import date, datetime

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        from decimal import Decimal
        from datetime import timedelta
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, bytes):
            return obj.decode('utf-8', errors='ignore')
        if isinstance(obj, timedelta):
            return str(obj)
        return super().default(obj)

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

def backup_db():
    conn = pymysql.connect(**DB_CONFIG)
    backup_data = {}
    try:
        with conn.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = [list(t.values())[0] for t in cursor.fetchall()]
            for table in tables:
                cursor.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                backup_data[table] = rows
                
        with open('backup.json', 'w') as f:
            json.dump(backup_data, f, cls=CustomJSONEncoder)
        print("Database backed up successfully to backup.json")
    finally:
        conn.close()

if __name__ == "__main__":
    backup_db()
