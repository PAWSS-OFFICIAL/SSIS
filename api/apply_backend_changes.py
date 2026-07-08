import re
import shutil

def patch_server():
    shutil.copyfile('server.py', 'server_backup.py')
    with open('server.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Models
    content = re.sub(
        r'department: Optional\[str\] = None\s+year: Optional\[str\] = None\s+section: Optional\[str\] = "A"',
        'class_id: Optional[int] = None\n    section_id: Optional[int] = None',
        content
    )
    content = re.sub(
        r'department: str\s+year: str\s+section: str',
        'class_id: int\n    section_id: int',
        content
    )
    content = re.sub(
        r'department: Optional\[str\] = None\s+year: Optional\[str\] = None\s+section: Optional\[str\] = None',
        'class_id: Optional[int] = None\n    section_id: Optional[int] = None',
        content
    )

    # 2. Get Users endpoint
    new_get_users = """@api_router.get("/users")
async def get_users(
    token: dict = Depends(verify_token), 
    role: Optional[str] = None, 
    class_id: Optional[int] = None, 
    section_id: Optional[int] = None, 
    search: Optional[str] = None,
    sort_by: Optional[str] = 'created_at',
    sort_order: Optional[str] = 'desc'
):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            query = \"\"\"
                SELECT u.id, u.username, u.email, u.role, u.name, 
                       u.class_id, u.section_id, u.parent_id as linked_student_id, 
                       u.created_at, u.idno as roll_number,
                       c.name as class_name, s.name as section_name
                FROM users u
                LEFT JOIN classes c ON u.class_id = c.id
                LEFT JOIN sections s ON u.section_id = s.id
                WHERE 1=1
            \"\"\"
            params = []
            if role and role != 'all':
                query += " AND u.role = %s"
                params.append(role)
            if class_id:
                query += " AND u.class_id = %s"
                params.append(class_id)
            if section_id:
                query += " AND u.section_id = %s"
                params.append(section_id)
            if search:
                query += " AND (u.name LIKE %s OR u.email LIKE %s OR u.username LIKE %s OR u.idno LIKE %s)"
                search_term = f"%{search}%"
                params.extend([search_term, search_term, search_term, search_term])
                
            allowed_sort_columns = ['name', 'email', 'role', 'created_at', 'class_name', 'section_name', 'roll_number']
            if sort_by not in allowed_sort_columns:
                sort_by = 'created_at'
            sort_order = 'ASC' if sort_order.lower() == 'asc' else 'DESC'
            
            query += f" ORDER BY {sort_by} {sort_order}"
            
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
"""
    content = re.sub(r'@api_router\.get\("/users"\).*?(?=@api_router)', new_get_users, content, flags=re.DOTALL)

    # 3. Post Users endpoint
    new_post_users = """@api_router.post("/users")
async def create_user(user: UserCreate, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user.username, user.email))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Username or email already exists")

            if user.role == "Student":
                if not user.class_id or not user.section_id:
                    raise HTTPException(status_code=400, detail="Class and Section are required for Students")
                if not user.idno:
                    raise HTTPException(status_code=400, detail="Roll Number (idno) is required for Students")

            if user.idno:
                cursor.execute("SELECT id FROM users WHERE idno = %s", (user.idno,))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail=f"Roll Number {user.idno} is already taken")

            hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            try:
                cursor.execute(\"\"\"
                INSERT INTO users (username, email, password, role, name, idno, class_id, section_id, parent_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                \"\"\", (user.username, user.email, hashed_password, user.role, user.name, 
                  user.idno, user.class_id, user.section_id, user.parent_id))
                conn.commit()
                return {"message": f"User {user.username} created successfully"}
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
"""
    content = re.sub(r'@api_router\.post\("/users"\).*?(?=@api_router)', new_post_users, content, flags=re.DOTALL)

    # 4. Get Dashboard Stats
    new_dashboard_stats = """@api_router.get("/dashboard/stats")
async def get_dashboard_stats(token: dict = Depends(verify_token)):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            stats = {}
            if token['role'] == 'Admin':
                cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'Student'")
                stats['total_students'] = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'Teacher'")
                stats['total_teachers'] = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(*) as count FROM sections")
                stats['total_classes'] = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(DISTINCT parent_id) as count FROM users WHERE role = 'Student' AND parent_id IS NOT NULL")
                stats['total_parents'] = cursor.fetchone()['count']
            
            return stats
"""
    content = re.sub(r'@api_router\.get\("/dashboard/stats"\).*?(?=@api_router)', new_dashboard_stats, content, flags=re.DOTALL)

    # 5. Departments -> Classes & Sections
    department_routes_pattern = re.compile(
        r'@api_router\.get\("/departments"\).*?@api_router\.delete\("/departments/\{dept_id\}"\).*?return \{"message": "Department deleted"\}',
        re.DOTALL
    )

    new_classes_routes = """@api_router.get("/classes")
async def get_classes(token: dict = Depends(verify_token)):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM classes ORDER BY sequence_order ASC, name ASC")
            return cursor.fetchall()

class ClassCreate(BaseModel):
    name: str
    sequence_order: int = 0

@api_router.post("/classes")
async def add_class(cls: ClassCreate, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            try:
                cursor.execute("INSERT INTO classes (name, sequence_order) VALUES (%s, %s)", (cls.name, cls.sequence_order))
                conn.commit()
                return {"message": f"Class {cls.name} added"}
            except Exception as e:
                raise HTTPException(status_code=400, detail="Class already exists")

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: int, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM classes WHERE id = %s", (class_id,))
            conn.commit()
            return {"message": "Class deleted"}

@api_router.get("/classes/{class_id}/sections")
async def get_sections(class_id: int, token: dict = Depends(verify_token)):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM sections WHERE class_id = %s ORDER BY name ASC", (class_id,))
            return cursor.fetchall()

class SectionCreate(BaseModel):
    name: str

@api_router.post("/classes/{class_id}/sections")
async def add_section(class_id: int, sec: SectionCreate, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            try:
                cursor.execute("INSERT INTO sections (class_id, name) VALUES (%s, %s)", (class_id, sec.name))
                conn.commit()
                return {"message": f"Section {sec.name} added"}
            except Exception:
                raise HTTPException(status_code=400, detail="Section already exists")

@api_router.delete("/sections/{section_id}")
async def delete_section(section_id: int, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM sections WHERE id = %s", (section_id,))
            conn.commit()
            return {"message": "Section deleted"}"""

    content = department_routes_pattern.sub(new_classes_routes, content)

    # 6. Courses routes
    new_get_courses = """@api_router.get("/courses")
async def get_courses(token: dict = Depends(verify_token), class_id: Optional[int] = None, section_id: Optional[int] = None):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            query = "SELECT c.*, cls.name as class_name, sec.name as section_name, u.name as teacher_name FROM courses c LEFT JOIN classes cls ON c.class_id = cls.id LEFT JOIN sections sec ON c.section_id = sec.id LEFT JOIN users u ON c.teacher_id = u.id WHERE 1=1"
            params = []
            if class_id:
                query += " AND c.class_id = %s"
                params.append(class_id)
            if section_id:
                query += " AND c.section_id = %s"
                params.append(section_id)
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
"""
    content = re.sub(r'@api_router\.get\("/courses"\).*?(?=@api_router)', new_get_courses, content, flags=re.DOTALL)

    new_post_courses = """class CourseCreate(BaseModel):
    name: str
    code: str
    class_id: int
    section_id: int
    teacher_id: int
    description: Optional[str] = None
    credits: Optional[int] = 3

@api_router.post("/courses")
async def add_course(course: CourseCreate, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO courses (name, code, class_id, section_id, teacher_id, description, credits) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (course.name, course.code, course.class_id, course.section_id, course.teacher_id, course.description, course.credits)
            )
            conn.commit()
            return {"message": f"Course {course.name} created"}
"""
    content = re.sub(r'@api_router\.post\("/courses"\).*?(?=@api_router)', new_post_courses, content, flags=re.DOTALL)

    # 7. Timetable setup
    new_timetable = """@api_router.get("/timetable")
async def get_timetable(token: dict = Depends(verify_token), class_id: Optional[int] = None, section_id: Optional[int] = None):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            query = "SELECT t.*, c.name as subject_name, u.name as teacher_name FROM timetable_entries t LEFT JOIN courses c ON t.subject_id = c.id LEFT JOIN users u ON t.teacher_id = u.id WHERE 1=1"
            params = []
            if class_id:
                query += " AND t.class_id = %s"
                params.append(class_id)
            if section_id:
                query += " AND t.section_id = %s"
                params.append(section_id)
            cursor.execute(query, tuple(params))
            return cursor.fetchall()

class TimetableEntryCreate(BaseModel):
    class_id: int
    section_id: int
    subject_id: int
    teacher_id: int
    day_of_week: str
    period_number: int

@api_router.post("/timetable/slot")
async def add_timetable_slot(entry: TimetableEntryCreate, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Conflict check: No teacher in 2 classes at same time
            cursor.execute("SELECT id FROM timetable_entries WHERE teacher_id = %s AND day_of_week = %s AND period_number = %s",
                           (entry.teacher_id, entry.day_of_week, entry.period_number))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Teacher is already scheduled for this period in another class.")
            
            # Conflict check: No 2 subjects in same class at same time
            cursor.execute("SELECT id FROM timetable_entries WHERE class_id = %s AND section_id = %s AND day_of_week = %s AND period_number = %s",
                           (entry.class_id, entry.section_id, entry.day_of_week, entry.period_number))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="This class/section already has a subject scheduled for this period.")

            cursor.execute(
                "INSERT INTO timetable_entries (class_id, section_id, subject_id, teacher_id, day_of_week, period_number) VALUES (%s, %s, %s, %s, %s, %s)",
                (entry.class_id, entry.section_id, entry.subject_id, entry.teacher_id, entry.day_of_week, entry.period_number)
            )
            conn.commit()
            return {"message": "Timetable slot added"}
"""
    content = re.sub(r'@api_router\.get\("/timetable"\).*?(?=@api_router)', new_timetable, content, flags=re.DOTALL)

    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    patch_server()
