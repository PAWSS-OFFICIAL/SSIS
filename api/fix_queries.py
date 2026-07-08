import re

def fix_sql_queries():
    with open('server.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements in SELECT queries
    content = re.sub(r'department,\s*year,\s*section', 'class_id, section_id', content)
    content = re.sub(r'department,\s*year', 'class_id, section_id', content)
    content = re.sub(r'department,\s*is_hod', 'class_id, section_id, is_hod', content)
    content = re.sub(r'department', 'class_id', content)
    content = re.sub(r'year', 'section_id', content)
    
    # Revert some false positives (e.g., table names, variable names, words like "year")
    # Actually, a global replace of 'department' -> 'class_id' inside SQL strings only is better.
    pass

def safer_fix_sql_queries():
    with open('server.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace in specific known broken lines
    content = content.replace("SELECT id, username, email, name, name as full_name, \n                       department, is_hod, hod_department, created_at",
                              "SELECT id, username, email, name, name as full_name, \n                       class_id, is_hod, hod_department, created_at")
    content = content.replace("SELECT department, year FROM courses WHERE id = %s",
                              "SELECT class_id, section_id FROM courses WHERE id = %s")
    content = content.replace("SELECT id, username, email, role, name, idno, department, year, section, created_at",
                              "SELECT id, username, email, role, name, idno, class_id, section_id, created_at")
    content = content.replace("SELECT id, username, email, name as full_name, idno as usn, department, section",
                              "SELECT id, username, email, name as full_name, idno as usn, class_id, section_id")
    content = content.replace("SELECT department, year, section FROM users",
                              "SELECT class_id, section_id FROM users")
    content = content.replace("SELECT id, name, department, year, section FROM users",
                              "SELECT id, name, class_id, section_id FROM users")
    content = content.replace("SELECT name, department FROM users",
                              "SELECT name, class_id FROM users")
    content = content.replace("SELECT department, year FROM users",
                              "SELECT class_id, section_id FROM users")
    content = content.replace("WHERE c.department = (SELECT department FROM users WHERE id = %s)",
                              "WHERE c.class_id = (SELECT class_id FROM users WHERE id = %s)")
    content = content.replace("SELECT department FROM courses WHERE id = %s",
                              "SELECT class_id FROM courses WHERE id = %s")
    content = content.replace("SELECT u.id, u.name, u.idno as usn, u.department",
                              "SELECT u.id, u.name, u.idno as usn, u.class_id")
    content = content.replace("SELECT es.*, u.name as student_name, u.idno as usn, u.department",
                              "SELECT es.*, u.name as student_name, u.idno as usn, u.class_id")
    content = content.replace("SELECT id, name, idno as usn, department, year, section",
                              "SELECT id, name, idno as usn, class_id, section_id")
    content = content.replace("SELECT name, department, year FROM users",
                              "SELECT name, class_id, section_id FROM users")
    content = content.replace("SELECT department FROM users WHERE id = %s",
                              "SELECT class_id FROM users WHERE id = %s")
    content = content.replace("SELECT id, username, email, name as full_name, idno as usn, department",
                              "SELECT id, username, email, name as full_name, idno as usn, class_id")

    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    safer_fix_sql_queries()
