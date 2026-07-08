import re

def append_endpoints():
    with open('server.py', 'r', encoding='utf-8') as f:
        content = f.read()

    new_endpoints = """
# ==========================================
# EXAM HALLS & CLASSROOMS
# ==========================================

class ClassroomCreate(BaseModel):
    name: str
    capacity: int
    bench_count: int

@api_router.get("/classrooms")
async def get_classrooms(token: dict = Depends(verify_token)):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM classrooms ORDER BY name ASC")
            return cursor.fetchall()

@api_router.post("/classrooms")
async def add_classroom(room: ClassroomCreate, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO classrooms (name, capacity, bench_count) VALUES (%s, %s, %s)",
                           (room.name, room.capacity, room.bench_count))
            conn.commit()
            return {"message": "Classroom added"}

@api_router.delete("/classrooms/{room_id}")
async def delete_classroom(room_id: int, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM classrooms WHERE id = %s", (room_id,))
            conn.commit()
            return {"message": "Classroom deleted"}

# ==========================================
# ANNOUNCEMENTS
# ==========================================

class AnnouncementCreate(BaseModel):
    message: str
    target_class_id: Optional[int] = None
    target_section_id: Optional[int] = None

@api_router.get("/announcements")
async def get_announcements(token: dict = Depends(verify_token)):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(\"\"\"
                SELECT a.*, c.name as class_name, s.name as section_name, u.name as sender_name
                FROM announcements a
                LEFT JOIN classes c ON a.target_class_id = c.id
                LEFT JOIN sections s ON a.target_section_id = s.id
                LEFT JOIN users u ON a.sent_by = u.id
                ORDER BY a.sent_at DESC
            \"\"\")
            return cursor.fetchall()

@api_router.post("/announcements")
async def send_announcement(ann: AnnouncementCreate, token: dict = Depends(require_role('Admin'))):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO announcements (message, target_class_id, target_section_id, sent_by) VALUES (%s, %s, %s, %s)",
                           (ann.message, ann.target_class_id, ann.target_section_id, token['user_id']))
            conn.commit()
            # MOCK WHATSAPP SENDING HERE
            print(f"[MOCK WHATSAPP] Sent to Class {ann.target_class_id} Section {ann.target_section_id}: {ann.message}")
            return {"message": "Announcement sent"}
"""
    if "EXAM HALLS & CLASSROOMS" not in content:
        with open('server.py', 'a', encoding='utf-8') as f:
            f.write(new_endpoints)

if __name__ == "__main__":
    append_endpoints()
