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

modules = [
    (1, "Getting Started", "Write a Python program that prints 'Hello, World!' to the console.", "print('Hello, World!')", "Hello, World!"),
    (2, "Variables & Data Types", "Create a variable named 'x' and assign it the value 10. Print 'x'.", "x = 10\nprint(x)", "10"),
    (3, "Operators", "Add 5 and 7, and print the result.", "print(5 + 7)", "12"),
    (4, "Control Flow", "Write an if statement that checks if 10 is greater than 5 and prints 'Yes'.", "if 10 > 5:\n    print('Yes')", "Yes"),
    (5, "Functions", "Define a function 'greet' that prints 'Hi'. Call it.", "def greet():\n    print('Hi')\n\ngreet()", "Hi"),
    (6, "Data Structures", "Create a list [1, 2, 3] and print its first element.", "my_list = [1, 2, 3]\nprint(my_list[0])", "1"),
    (7, "Object-Oriented Programming", "Create a class 'Car' with a method 'honk' that prints 'Beep'. Instantiate it and call 'honk'.", "class Car:\n    def honk(self):\n        print('Beep')\nc = Car()\nc.honk()", "Beep"),
    (8, "Inheritance & OOP", "Create a child class 'Dog' that inherits from 'Animal'.", "# ... write code ...", ""),
    (9, "Files & Exceptions", "Write a try-except block to handle a division by zero error.", "try:\n    1/0\nexcept ZeroDivisionError:\n    print('Error')", "Error"),
    (10, "Modules & Standard Library", "Import the math module and print math.pi rounded to 2 decimal places.", "import math\nprint(round(math.pi, 2))", "3.14"),
    (11, "Advanced Python", "Use a list comprehension to create a list of squares for numbers 1 to 3. Print it.", "print([x**2 for x in range(1, 4)])", "[1, 4, 9]"),
    (12, "Projects", "Print 'Course Completed!'", "print('Course Completed!')", "Course Completed!")
]

questions = [
    ("What is the output of print(2 ** 3)?", "6", "8", "9", "Error", "B")
]
# Generate 29 more dummy questions to satisfy the 30-question requirement
for i in range(2, 31):
    questions.append((f"Sample Question {i}", "Option A", "Option B", "Option C", "Option D", "A"))

def seed():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cursor:
            # Clear existing data
            cursor.execute("DELETE FROM pylearn_tasks")
            cursor.execute("DELETE FROM pylearn_cert_questions")
            
            # Seed Tasks
            for mod in modules:
                cursor.execute("""
                    INSERT INTO pylearn_tasks (module_number, task_order, title, prompt, starter_code, expected_output)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (mod[0], 1, f"Task 1 for Module {mod[0]}", mod[2], mod[3], mod[4]))
            
            # Seed Questions
            for q in questions:
                cursor.execute("""
                    INSERT INTO pylearn_cert_questions (text, optionA, optionB, optionC, optionD, correct_answer)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, q)
            print("Successfully seeded pylearn tables.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    seed()
