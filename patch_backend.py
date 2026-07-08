import os

def patch_backend():
    filepath = 'api/server.py'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update idno aliasing
    content = content.replace("'usn': user.get('idno')", "'roll_no': user.get('idno'), 'usn': user.get('idno')")
    content = content.replace("u.idno as usn", "u.idno as roll_no, u.idno as usn")
    
    # 2. Update chatbot and email domains
    content = content.replace("jainuniversity.ac.in", "ssis.edu.in")
    content = content.replace("JAIN University", "SSIS")
    
    # 3. Update HOD endpoints mapping to Principal
    content = content.replace("/hod/", "/principal/")
    
    # Note: DB schema still has hod_department, so we leave it as is to not break SQL queries.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_backend()
