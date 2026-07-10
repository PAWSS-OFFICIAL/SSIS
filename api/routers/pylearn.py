from fastapi import APIRouter, Depends, HTTPException, Body
import pymysql
import os
from typing import Dict, Any

# Depending on server.py's implementation, these might need to be imported or duplicated
# To avoid circular imports, we'll redefine the dependency or assume they are passed
# But wait, in FastAPI it's better to just use a router and let server.py import it.
# We will need the DB_CONFIG and the token verifier.
from server import verify_token, require_role, get_db_connection

router = APIRouter(prefix="/student/pylearn", tags=["PyLearn"])

@router.get("/progress")
def get_pylearn_progress(token: dict = Depends(require_role("Student"))):
    user_id = token['user_id']
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT task_id FROM pylearn_task_completions WHERE user_id = %s AND passed = TRUE", (user_id,))
            completions = [row['task_id'] for row in cursor.fetchall()]
            
            cursor.execute("SELECT module_number FROM pylearn_module_stars WHERE user_id = %s", (user_id,))
            stars = [row['module_number'] for row in cursor.fetchall()]
            
            cursor.execute("SELECT * FROM pylearn_cert_attempts WHERE user_id = %s ORDER BY attempted_at DESC", (user_id,))
            certAttempts = cursor.fetchall()
            
            return {
                "completions": completions,
                "stars": stars,
                "certAttempts": certAttempts,
                "unlockedCertificate": len(stars) >= 12
            }
    finally:
        conn.close()

@router.get("/module/{module_id}")
def get_pylearn_module(module_id: int, token: dict = Depends(require_role("Student"))):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM pylearn_tasks WHERE module_number = %s ORDER BY task_order ASC", (module_id,))
            tasks = cursor.fetchall()
            
            if not tasks:
                raise HTTPException(status_code=404, detail="Module not found or has no tasks")
                
            return {
                "id": module_id,
                "title": f"Module {module_id}",
                "lessons": [
                    {
                        "id": 1,
                        "title": "Interactive Task",
                        "content": tasks[0]['prompt'],
                        "starter": tasks[0]['starter_code']
                    }
                ],
                "tasks": [
                    {
                        "id": str(t['id']),
                        "title": t['title'],
                        "prompt": t['prompt'],
                        "expectedOutput": t['expected_output']
                    }
                    for t in tasks
                ]
            }
    finally:
        conn.close()

@router.post("/submit")
def submit_task(data: dict = Body(...), token: dict = Depends(require_role("Student"))):
    user_id = token['user_id']
    task_id = data.get('taskId')
    stdout = data.get('stdout', '')
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM pylearn_tasks WHERE id = %s", (task_id,))
            task = cursor.fetchone()
            
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
                
            clean_user = ' '.join(stdout.split())
            clean_expected = ' '.join((task['expected_output'] or '').split())
            passed = (clean_user == clean_expected)
            
            if not passed:
                return {
                    "success": False,
                    "error": "Output does not match expected output",
                    "userOutput": clean_user,
                    "expectedOutput": clean_expected
                }
                
            # Record completion
            cursor.execute("""
                INSERT INTO pylearn_task_completions (user_id, task_id, passed) 
                VALUES (%s, %s, TRUE) 
                ON DUPLICATE KEY UPDATE passed = TRUE, completed_at = CURRENT_TIMESTAMP
            """, (user_id, task_id))
            
            # Check if all tasks in module are passed
            module_num = task['module_number']
            cursor.execute("SELECT COUNT(*) as count FROM pylearn_tasks WHERE module_number = %s", (module_num,))
            total_tasks = cursor.fetchone()['count']
            
            cursor.execute("""
                SELECT COUNT(*) as count FROM pylearn_task_completions c 
                JOIN pylearn_tasks t ON c.task_id = t.id 
                WHERE c.user_id = %s AND t.module_number = %s AND c.passed = TRUE
            """, (user_id, module_num))
            passed_tasks = cursor.fetchone()['count']
            
            starAwarded = False
            if passed_tasks >= total_tasks:
                cursor.execute("""
                    INSERT IGNORE INTO pylearn_module_stars (user_id, module_number)
                    VALUES (%s, %s)
                """, (user_id, module_num))
                if cursor.rowcount > 0:
                    starAwarded = True
                    
            cursor.execute("SELECT COUNT(*) as count FROM pylearn_module_stars WHERE user_id = %s", (user_id,))
            stars_count = cursor.fetchone()['count']
            
            conn.commit()
            return {
                "success": True,
                "starAwarded": starAwarded,
                "starsCount": stars_count,
                "unlockedCertificate": stars_count >= 12
            }
    finally:
        conn.close()

@router.get("/certificate/questions")
def get_cert_questions(token: dict = Depends(require_role("Student"))):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, text, optionA, optionB, optionC, optionD FROM pylearn_cert_questions LIMIT 30")
            questions = cursor.fetchall()
            return questions
    finally:
        conn.close()

@router.post("/certificate/submit")
def submit_cert(data: dict = Body(...), token: dict = Depends(require_role("Student"))):
    user_id = token['user_id']
    cert_name = data.get('certificateName', '')
    answers = data.get('answers', [])
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM pylearn_module_stars WHERE user_id = %s", (user_id,))
            stars = cursor.fetchone()['count']
            if stars < 12:
                raise HTTPException(status_code=403, detail="Certificate exam locked. Earn 12 stars first.")
                
            cursor.execute("SELECT id, correct_answer FROM pylearn_cert_questions")
            correct_map = {str(r['id']): r['correct_answer'] for r in cursor.fetchall()}
            
            score = 0
            for ans in answers:
                qid = str(ans.get('questionId'))
                selected = ans.get('selectedAnswer', '').strip().upper()
                if correct_map.get(qid) == selected:
                    score += 1
                    
            passed = score >= 24
            
            cursor.execute("""
                INSERT INTO pylearn_cert_attempts (user_id, certificate_name, score, passed)
                VALUES (%s, %s, %s, %s)
            """, (user_id, cert_name, score, passed))
            
            if not passed:
                cursor.execute("DELETE FROM pylearn_module_stars WHERE user_id = %s", (user_id,))
                
            conn.commit()
            return {
                "success": True,
                "score": score,
                "passed": passed,
                "correctAnswersCount": score,
                "totalQuestions": 30
            }
    finally:
        conn.close()
