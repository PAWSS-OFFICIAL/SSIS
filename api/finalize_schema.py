import os
import pymysql
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USERNAME')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_DATABASE')
DB_PORT = int(os.environ.get('DB_PORT', 4000))

def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        ssl={'ssl': {'ca': '/etc/ssl/cert.pem'}}
    )

def finalize_schema():
    print("--- Finalizing Schema for QuizMasterX ---")
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. QUIZZES Table
            print("Checking table: quizzes")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS quizzes (
                    quiz_id VARCHAR(36) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    quiz_type VARCHAR(50) DEFAULT 'mcq',
                    time_limit INT DEFAULT 30,
                    due_date VARCHAR(50),
                    due_time VARCHAR(50),
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users(id)
                )
            """)

            # 2. QUESTIONS Table
            print("Checking table: questions")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS questions (
                    question_id VARCHAR(36) PRIMARY KEY,
                    quiz_id VARCHAR(36),
                    question_text TEXT,
                    type VARCHAR(50),
                    marks INT DEFAULT 1,
                    options JSON, 
                    correct_option TEXT,
                    language VARCHAR(50),
                    test_cases JSON,
                    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
                )
            """)

            # 3. SUBMISSIONS Table (Renamed from responses to match code)
            print("Checking table: submissions")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS submissions (
                    submission_id VARCHAR(255) PRIMARY KEY,
                    classwork_id VARCHAR(255) NULL,
                    quiz_id VARCHAR(255) NULL,
                    student_id VARCHAR(255),
                    content LONGTEXT NULL,
                    answers JSON NULL,
                    code_submitted LONGTEXT NULL,
                    output LONGTEXT NULL,
                    marks_obtained INT NULL,
                    tab_switches INT DEFAULT 0,
                    time_taken INT NULL,
                    status VARCHAR(50) DEFAULT 'submitted',
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
                )
            """)

            # 4. AI_ANALYSIS Table
            print("Checking table: ai_analysis")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_analysis (
                    analysis_id INT AUTO_INCREMENT PRIMARY KEY,
                    submission_id VARCHAR(36),
                    student_id INT,
                    ai_score FLOAT,
                    originality_score FLOAT,
                    style_anomaly_score FLOAT,
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (submission_id) REFERENCES submissions(submission_id)
                )
            """)

            # 5. ATTENDANCE LOGS (For behavior tracking)
            print("Checking table: attendance_logs")
            cursor.execute("""
                 CREATE TABLE IF NOT EXISTS attendance_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id VARCHAR(100),
                    student_id INT,
                    action_type VARCHAR(50),
                    details JSON,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            print("Schema Finalization Complete.")

    except Exception as e:
        print(f"Error finalizing schema: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    finalize_schema()
