import os
import pymysql
import json
from dotenv import load_dotenv
from pathlib import Path

# Load config
ROOT_DIR = Path(__file__).parent # api/
load_dotenv(ROOT_DIR / '.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': {}},
}

def seed():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            # 1. Create a Quiz
            quiz_id = "quiz_nextgen_001"
            cursor.execute("""
                INSERT INTO quizzes (quiz_id, title, description, quiz_type, due_date, due_time)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE title=VALUES(title)
            """, (quiz_id, "Python & Logic Fundamentals", "A NextGen assessment covering coding and MCQs.", "coding", "2026-12-31", "23:59:00"))
            
            # 2. Add MCQ Question
            q1_id = "q_mcq_001"
            options = {"a": "High-level", "b": "Low-level", "c": "Machine-level", "d": "Assembly"}
            cursor.execute("""
                INSERT INTO questions (question_id, quiz_id, question_text, options, correct_option, marks)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE question_text=VALUES(question_text)
            """, (q1_id, quiz_id, "What type of language is Python?", json.dumps(options), "a", 5))
            
            # 3. Add Coding Question
            q2_id = "q_code_001"
            cursor.execute("""
                INSERT INTO questions (question_id, quiz_id, question_text, language, marks)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE question_text=VALUES(question_text)
            """, (q2_id, quiz_id, "Write a Python function to calculate the factorial of a number.", "python", 15))
            
            conn.commit()
            print("SUCCESS: Seeded NextGen Quiz data!")
    finally:
        conn.close()

if __name__ == "__main__":
    seed()
