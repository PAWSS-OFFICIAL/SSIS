import sys
import os
sys.path.append('api')
from server import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            query = """
                SELECT u.id, u.username, u.email, u.role, u.name, 
                       u.class_id, u.section_id, u.parent_id as linked_student_id, 
                       u.created_at, u.idno as roll_number,
                       c.name as class_name, s.name as section_name,
                       p.name as parent_name, p.phone as parent_phone,
                       (SELECT GROUP_CONCAT(CONCAT(co.name, ' (', cl.name, '-', se.name, ')') SEPARATOR ', ')
                        FROM courses co
                        JOIN classes cl ON co.class_id = cl.id
                        JOIN sections se ON co.section_id = se.id
                        WHERE co.teacher_id = u.id) as subjects_taught,
                       (SELECT CONCAT(cl.name, '-', se.name)
                        FROM class_teachers_new ct
                        JOIN classes cl ON ct.class_id = cl.id
                        JOIN sections se ON ct.section_id = se.id
                        WHERE ct.teacher_id = u.id LIMIT 1) as class_teacher_for
                FROM users u
                LEFT JOIN classes c ON u.class_id = c.id
                LEFT JOIN sections s ON u.section_id = s.id
                LEFT JOIN parents p ON u.id = p.student_id AND p.is_primary_contact = 1
                WHERE 1=1 ORDER BY created_at DESC
            """
            cursor.execute(query)
            print("Query successful!")
            print(f"Fetched {len(cursor.fetchall())} rows")
except Exception as e:
    print(f"Error: {type(e).__name__} - {e}")
