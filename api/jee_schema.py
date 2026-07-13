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

def apply_jee_schema():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            print("Creating jee_question_banks table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS jee_question_banks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            print("Creating jee_questions table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS jee_questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bank_id INT NOT NULL,
                subject VARCHAR(20) NOT NULL,
                question_text TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                justification TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (bank_id) REFERENCES jee_question_banks(id) ON DELETE CASCADE
            )
            """)

            print("Creating jee_quizzes table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS jee_quizzes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                duration_minutes INT DEFAULT 180,
                deadline DATETIME,
                target_type VARCHAR(50),
                target_id INT NULL,
                question_count INT DEFAULT 45,
                points_per_question INT DEFAULT 4,
                bank_ids JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            print("Creating jee_attempts table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS jee_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                quiz_id INT NOT NULL,
                student_id INT NOT NULL,
                status VARCHAR(50) DEFAULT 'IN_PROGRESS',
                score INT DEFAULT 0,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP NULL,
                FOREIGN KEY (quiz_id) REFERENCES jee_quizzes(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """)

            print("Creating jee_proctor_flags table...")
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS jee_proctor_flags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                attempt_id INT NOT NULL,
                student_id INT NOT NULL,
                flag_type VARCHAR(100) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                webcam_snapshot LONGTEXT,
                FOREIGN KEY (attempt_id) REFERENCES jee_attempts(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """)

            print("JEE schema migration completed successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_jee_schema()
