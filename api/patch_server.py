import re
import shutil

def patch_server():
    shutil.copyfile('server.py', 'server_backup_for_patch.py')
    with open('server.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Models
    content = re.sub(
        r'department: Optional\[str\] = None.*?section: Optional\[str\] = "A"',
        'class_id: Optional[int] = None\n    section_id: Optional[int] = None',
        content, flags=re.DOTALL
    )
    content = re.sub(
        r'department: str.*?section: str',
        'class_id: int\n    section_id: int',
        content, flags=re.DOTALL
    )
    content = re.sub(
        r'department: Optional\[str\] = None.*?section: Optional\[str\] = None',
        'class_id: Optional[int] = None\n    section_id: Optional[int] = None',
        content, flags=re.DOTALL
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
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user.username, user.email))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Username or email already exists")

            if user.role == "Student":
                if not user.class_id or not user.section_id:
                    raise HTTPException(status_code=400, detail="Class and Section are required for Students")
                if not user.idno:
                    raise HTTPException(status_code=400, detail="Roll Number (idno) is required for Students")

            # Check Roll Number uniqueness
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
                cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'Parent' AND linked_student_id IS NOT NULL")
                stats['total_parents'] = cursor.fetchone()['count']
            
            return stats
"""
    content = re.sub(r'@api_router\.get\("/dashboard/stats"\).*?(?=@api_router)', new_dashboard_stats, content, flags=re.DOTALL)

    # Write patched server
    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    patch_server()
