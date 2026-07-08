import os
import pymysql
from dotenv import load_dotenv
from pathlib import Path

# Load config
ROOT_DIR = Path(__file__).parent # This is 'api/' folder
load_dotenv(ROOT_DIR / '.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': {}},
}

SQL_COMMANDS = [
    """
    CREATE TABLE IF NOT EXISTS quizzes (
        quiz_id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        quiz_type ENUM('mcq', 'coding') NOT NULL,
        due_date DATE,
        due_time TIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS questions (
        question_id VARCHAR(255) PRIMARY KEY,
        quiz_id VARCHAR(255),
        question_text TEXT NOT NULL,
        options JSON,
        correct_option VARCHAR(10),
        language VARCHAR(50),
        marks INT DEFAULT 1,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
    )
    """,
    """
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
    """,
    """
    CREATE TABLE IF NOT EXISTS submissions_ai (
        id INT AUTO_INCREMENT PRIMARY KEY,
        submission_id VARCHAR(255),
        student_id VARCHAR(255),
        quiz_id VARCHAR(255),
        ai_score INT,
        originality_score INT,
        style_anomaly_score INT,
        ai_version VARCHAR(50),
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES submissions(submission_id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS drafts_autosave (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(255),
        quiz_id VARCHAR(255),
        draft_data JSON,
        last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY student_quiz_draft (student_id, quiz_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS tab_switch_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(255),
        quiz_id VARCHAR(255),
        switch_count INT DEFAULT 0,
        log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY student_quiz_switch (student_id, quiz_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS webhooks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        url VARCHAR(255) NOT NULL,
        events JSON NOT NULL,
        secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
    )
    """
]

def migrate():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            for sql in SQL_COMMANDS:
                try:
                    print(f"Executing: {sql.strip()[:60]}...")
                    cursor.execute(sql)
                    conn.commit()
                    print("DONE.")
                except Exception as e:
                    print(f"FAILED: {e}")
            print("\nMigration process finished.")
    except Exception as e:
        print(f"\nERROR during connection: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
