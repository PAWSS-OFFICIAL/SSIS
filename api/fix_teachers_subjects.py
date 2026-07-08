import re

def fix_teachers_subjects():
    with open('server.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_func = """async def get_teachers_with_subjects(department: str, token: dict = Depends(require_role('Admin'))):
    \"\"\"Fetch teachers and the courses common in their department\"\"\"
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Resolve department name if code is provided
            cursor.execute("SELECT name FROM departments WHERE code = %s OR name = %s", (department, department))
            dept_res = cursor.fetchone()
            dept_name = dept_res['name'] if dept_res else department

            # Get teachers
            cursor.execute("SELECT id, name FROM users WHERE role = 'Teacher'")
            teachers = cursor.fetchall()
            
            # Get courses for this department (match by code or name)
            cursor.execute(\"\"\"
                SELECT id, name, code FROM courses 
                WHERE department = %s OR department = %s
            \"\"\", (department, dept_name))
            courses = cursor.fetchall()
            
            return {"teachers": teachers, "courses": courses}"""
    
    new_func = """async def get_teachers_with_subjects(department: str, token: dict = Depends(require_role('Admin'))):
    \"\"\"Fetch teachers and the courses common in their class\"\"\"
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # department is actually class_id now
            class_id = department

            # Get teachers
            cursor.execute("SELECT id, name FROM users WHERE role = 'Teacher'")
            teachers = cursor.fetchall()
            
            # Get courses for this class
            cursor.execute(\"\"\"
                SELECT id, name, code FROM courses 
                WHERE class_id = %s
            \"\"\", (class_id,))
            courses = cursor.fetchall()
            
            return {"teachers": teachers, "courses": courses}"""
            
    content = content.replace(old_func, new_func)

    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_teachers_subjects()
