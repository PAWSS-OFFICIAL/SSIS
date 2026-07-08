"""
Full database schema migration for SSIS LMS.
Creates all required tables and seeds initial data.
"""
import pymysql
import bcrypt
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': {}},
    'cursorclass': pymysql.cursors.DictCursor
}

SCHEMA_SQL = """
-- Core users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin','Teacher','Student') NOT NULL DEFAULT 'Student',
    name VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(100),
    usn VARCHAR(50),
    roll_number VARCHAR(50),
    class_id INT,
    section VARCHAR(10),
    date_of_birth DATE,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    address TEXT,
    profile_pic VARCHAR(500),
    must_change_password BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    class_id INT,
    teacher_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade VARCHAR(20),
    section VARCHAR(10),
    academic_year VARCHAR(20),
    class_teacher_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    class_id INT,
    capacity INT DEFAULT 40,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT,
    class_id INT,
    date DATE NOT NULL,
    status ENUM('Present','Absent','Late','Excused') DEFAULT 'Present',
    marked_by INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grades/Marks table
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT,
    exam_type VARCHAR(100),
    marks_obtained DECIMAL(5,2),
    total_marks DECIMAL(5,2) DEFAULT 100,
    grade VARCHAR(5),
    semester VARCHAR(20),
    academic_year VARCHAR(20),
    remarks TEXT,
    entered_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id INT,
    target_role VARCHAR(50) DEFAULT 'All',
    target_class_id INT,
    priority ENUM('Low','Normal','High','Urgent') DEFAULT 'Normal',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timetable entries
CREATE TABLE IF NOT EXISTS timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section VARCHAR(10),
    subject_id INT,
    teacher_id INT,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classrooms
CREATE TABLE IF NOT EXISTS classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100),
    floor INT,
    capacity INT,
    facilities TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    approved_by INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers-Subjects mapping
CREATE TABLE IF NOT EXISTS teachers_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT,
    class_id INT,
    teacher_id INT,
    duration_minutes INT DEFAULT 30,
    total_marks INT DEFAULT 100,
    is_published BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('MCQ','True/False','Short Answer') DEFAULT 'MCQ',
    options JSON,
    correct_answer TEXT,
    marks INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz submissions
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    answers JSON,
    score DECIMAL(5,2),
    total_marks DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded BOOLEAN DEFAULT FALSE
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    class_id INT,
    teacher_id INT,
    credits INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def run_migration():
    print("Connecting to TiDB Cloud...")
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Execute schema creation
    statements = SCHEMA_SQL.split(';')
    for stmt in statements:
        stmt = stmt.strip()
        if not stmt:
            continue
        try:
            cursor.execute(stmt)
            # Extract table name for logging
            if 'CREATE TABLE' in stmt:
                table_name = stmt.split('EXISTS')[1].split('(')[0].strip() if 'EXISTS' in stmt else 'unknown'
                print(f"  ✅ Checked/Created table: {table_name}")
        except Exception as e:
            print(f"  ⚠️ Warning on table creation: {e}")
    
    conn.commit()
    print("\n📊 Schema created successfully!")
    
    # Seed accounts
    print("\n🌱 Seeding user accounts...")
    password = "1234567890"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    accounts = [
        ('admin', 'admin@ssis.edu.in', 'Admin', 'School Administrator'),
        ('teacher', 'teacher@ssis.edu.in', 'Teacher', 'Demo Teacher'),
        ('student', 'student@ssis.edu.in', 'Student', 'Demo Student'),
    ]
    
    for username, email, role, full_name in accounts:
        try:
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if not cursor.fetchone():
                cursor.execute(
                    """INSERT INTO users (username, email, password, role, name, full_name, roll_number, date_of_birth)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (username, email, hashed, role, full_name, full_name,
                     'R0001' if role == 'Student' else None,
                     '2010-01-15' if role == 'Student' else None)
                )
                print(f"  ✅ Created {role}: {username} / {password}")
            else:
                print(f"  ⏭️ {role} '{username}' already exists")
        except Exception as e:
            print(f"  ⚠️ Error creating {username}: {e}")
    
    # Seed a class
    try:
        cursor.execute("SELECT id FROM classes WHERE name = 'Class 10'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO classes (name, grade, section, academic_year) VALUES ('Class 10', '10', 'A', '2025-2026')")
            print("  ✅ Created Class 10-A")
    except Exception as e:
        print(f"  ⚠️ Error creating class: {e}")
    
    # Seed subjects
    try:
        subjects = [('Mathematics', 'MATH10'), ('Science', 'SCI10'), ('English', 'ENG10'), ('Social Studies', 'SS10')]
        for name, code in subjects:
            cursor.execute("SELECT id FROM subjects WHERE code = %s", (code,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO subjects (name, code, class_id, teacher_id) VALUES (%s, %s, 1, 2)", (name, code))
                print(f"  ✅ Created subject: {name}")
    except Exception as e:
        print(f"  ⚠️ Error creating subjects: {e}")
    
    conn.commit()
    conn.close()
    
    print("\n🎉 Migration complete! All tables created and seed data inserted.")
    print(f"\n📋 Login Credentials (password for all: {password}):")
    print("   Admin:   admin")
    print("   Teacher: teacher")
    print("   Student: student")
    print("   Parent:  Roll No: R0001, DOB: 2010-01-15")

if __name__ == "__main__":
    run_migration()
