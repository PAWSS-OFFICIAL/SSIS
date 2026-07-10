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
    'cursorclass': pymysql.cursors.DictCursor,
    'autocommit': True
}

def apply():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            with open('pylearn_schema.sql', 'r') as f:
                sql_statements = f.read().split(';')
                for statement in sql_statements:
                    if statement.strip():
                        cursor.execute(statement)
                        print("Executed statement successfully.")
    except Exception as e:
        print(f"Error applying schema: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    apply()
