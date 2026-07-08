import sys
sys.path.append('.')
from server import get_db_connection

tables = ['classes','sections','courses','classrooms','attendance_sessions','attendance_logs','timetable_entries','grades','announcements','exam_halls','exam_schedules']
with get_db_connection() as conn:
    with conn.cursor() as cursor:
        for t in tables:
            print(f'\n=== {t} ===')
            cursor.execute(f'DESCRIBE {t}')
            for row in cursor.fetchall():
                print(f"  {row['Field']} {row['Type']} {row['Key']}")
