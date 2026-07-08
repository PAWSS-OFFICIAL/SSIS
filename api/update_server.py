import re

def update_server():
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

    # 2. Add classes/sections routes (replacing /departments)
    department_routes_pattern = re.compile(
        r'@api_router\.get\("/departments"\).*?@api_router\.delete\("/departments/\{dept_id\}"\).*?return \{"message": "Department deleted"\}',
        re.DOTALL
    )

    new_routes = """@api_router.get("/classes")
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

    content = department_routes_pattern.sub(new_routes, content)

    # Note: A full regex replacement of 'department' might break other things (like gamification schema or frontend routes).
    # I should write the modified content to a new file, and test it.
    with open('server_new.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    update_server()
