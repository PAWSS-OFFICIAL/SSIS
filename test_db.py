import os
import pymysql
from dotenv import load_dotenv
from pathlib import Path

# Load config
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'api' / '.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': {}},
}

print(f"Attempting to connect to {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
try:
    conn = pymysql.connect(**DB_CONFIG)
    print("SUCCESS: Connected to TiDB!")
    conn.close()
except Exception as e:
    print(f"FAILED: {e}")
