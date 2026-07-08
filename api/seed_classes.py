import sys
import os

sys.path.append('.')
from server import get_db_connection

def seed_classes():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # Clear existing data
            cursor.execute("DELETE FROM sections")
            cursor.execute("DELETE FROM classes")
            
            # Create classes 5 to 12
            for i in range(5, 13):
                class_name = f"Class {i}"
                cursor.execute("INSERT INTO classes (name) VALUES (%s)", (class_name,))
                class_id = cursor.lastrowid
                
                # Add sections A, B, C, D, E for each class
                for section in ['A', 'B', 'C', 'D', 'E']:
                    cursor.execute(
                        "INSERT INTO sections (class_id, name) VALUES (%s, %s)",
                        (class_id, section)
                    )
                    
            conn.commit()
            print("Successfully seeded classes 5 to 12 with sections A-E.")

if __name__ == "__main__":
    seed_classes()
