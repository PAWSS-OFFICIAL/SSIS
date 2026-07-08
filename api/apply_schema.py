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

def apply_schema():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            # Drop old tables that we'll recreate or don't need
            print("Dropping old tables if they exist...")
            cursor.execute("DROP TABLE IF EXISTS timetable_slots")
            cursor.execute("DROP TABLE IF EXISTS class_teachers")
            cursor.execute("DROP TABLE IF EXISTS timetables")
            cursor.execute("DROP TABLE IF EXISTS attendance")
            cursor.execute("DROP TABLE IF EXISTS classwork")

            # Create new tables
            print("Creating classes table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                sequence_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            print("Creating sections table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS sections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                name VARCHAR(10) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                UNIQUE KEY unique_class_section (class_id, name)
            )
            """)

            print("Creating classrooms table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS classrooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                capacity INT NOT NULL,
                bench_count INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            print("Creating announcements table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                message TEXT NOT NULL,
                target_class_id INT NULL,
                target_section_id INT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_by INT NULL,
                FOREIGN KEY (target_class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (target_section_id) REFERENCES sections(id) ON DELETE CASCADE
            )
            """)

            print("Altering users table...")
            # Drop foreign keys if they exist on users? Assuming none exist for these.
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN class_id INT NULL")
                cursor.execute("ALTER TABLE users ADD FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL")
            except Exception as e: print("class_id might already exist:", e)

            try:
                cursor.execute("ALTER TABLE users ADD COLUMN section_id INT NULL")
                cursor.execute("ALTER TABLE users ADD FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL")
            except Exception as e: print("section_id might already exist:", e)

            # Enforce unique Roll Number globally. idno is Roll Number.
            try:
                cursor.execute("ALTER TABLE users ADD UNIQUE KEY unique_idno (idno)")
            except Exception as e: print("unique_idno might already exist:", e)

            try:
                cursor.execute("ALTER TABLE users DROP COLUMN department")
            except Exception as e: print("Could not drop department:", e)
            try:
                cursor.execute("ALTER TABLE users DROP COLUMN year")
            except Exception as e: print("Could not drop year:", e)
            try:
                cursor.execute("ALTER TABLE users DROP COLUMN section")
            except Exception as e: print("Could not drop section:", e)


            print("Altering courses table...")
            try:
                cursor.execute("ALTER TABLE courses ADD COLUMN class_id INT NULL")
                cursor.execute("ALTER TABLE courses ADD FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE")
            except Exception as e: print("courses.class_id might already exist:", e)

            try:
                cursor.execute("ALTER TABLE courses ADD COLUMN section_id INT NULL")
                cursor.execute("ALTER TABLE courses ADD FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE")
            except Exception as e: print("courses.section_id might already exist:", e)

            try:
                cursor.execute("ALTER TABLE courses DROP COLUMN department")
            except Exception as e: print("Could not drop department from courses:", e)
            try:
                cursor.execute("ALTER TABLE courses DROP COLUMN year")
            except Exception as e: print("Could not drop year from courses:", e)

            print("Creating timetable_entries table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS timetable_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                section_id INT NOT NULL,
                subject_id INT NOT NULL,
                teacher_id INT NOT NULL,
                day_of_week VARCHAR(15) NOT NULL,
                period_number INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """)
            
            # Additional table for Subject Teachers vs Class Teachers
            # We need a way to assign one class teacher per section.
            print("Creating class_teachers_new table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS class_teachers_new (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                section_id INT NOT NULL,
                teacher_id INT NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
                FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_section_teacher (section_id)
            )
            """)

            # Because the old courses table holds the mapping between class/section and subject+teacher,
            # we can reuse courses table for subject assignments.
            
            # Since this is a fresh start, let's truncate users except Admins, and truncate courses.
            print("Cleaning up old student/teacher data...")
            cursor.execute("DELETE FROM users WHERE role IN ('Student', 'Teacher', 'Parent')")
            cursor.execute("DELETE FROM courses")
            
            # Drop departments table
            try:
                cursor.execute("DROP TABLE IF EXISTS departments")
            except Exception as e: print(e)

            print("Schema migration completed successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_schema()
