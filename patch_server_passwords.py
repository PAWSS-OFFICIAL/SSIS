import re

with open(r"api/server.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update create_user
create_user_pattern = r"            hashed_password = bcrypt\.hashpw\(user\.password\.encode\('utf-8'\), bcrypt\.gensalt\(\)\)\.decode\('utf-8'\)\s*try:\s*cursor\.execute\(\"\"\"\s*INSERT INTO users \(username, email, password, role, name, idno, class_id, section_id,\s*parent_id, date_of_birth, gender, blood_group, address,\s*previous_school, date_of_admission, phone\)\s*VALUES \(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s\)\s*\"\"\", \(user\.username, user\.email, hashed_password, user\.role, user\.name,"

create_user_replacement = """            final_username = user.username
            if user.role == "Student":
                import datetime
                current_year = datetime.datetime.now().year
                raw_pw = f"SSIS{current_year}{user.idno}"
                hashed_password = bcrypt.hashpw(raw_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                final_username = user.name.replace(' ', '').lower()
            else:
                hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            try:
                cursor.execute(\"\"\"
                INSERT INTO users (username, email, password, role, name, idno, class_id, section_id,
                                   parent_id, date_of_birth, gender, blood_group, address,
                                   previous_school, date_of_admission, phone)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                \"\"\", (final_username, user.email, hashed_password, user.role, user.name,"""

if not re.search(create_user_pattern, content):
    print("Pattern for create_user NOT FOUND")
else:
    content = re.sub(create_user_pattern, create_user_replacement, content)
    print("Replaced create_user pattern")


# 2. Update bulk_upload_students
bulk_upload_pattern = r"                      email = f\"\{usn\.lower\(\)\}@ssis\.edu\.in\"\s*username = row_dict\['student_name'\]\.replace\(' ', ''\)\.lower\(\)\s*student_hashed_pw = bcrypt\.hashpw\(usn\.encode\('utf-8'\), bcrypt\.gensalt\(\)\)\.decode\('utf-8'\)"

bulk_upload_replacement = """                      email = f"{usn.lower()}@ssis.edu.in"
                      username = row_dict['student_name'].replace(' ', '').lower()
                      
                      import datetime
                      current_year = datetime.datetime.now().year
                      raw_pw = f"SSIS{current_year}{usn}"
                      student_hashed_pw = bcrypt.hashpw(raw_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')"""

if not re.search(bulk_upload_pattern, content):
    print("Pattern for bulk_upload_students NOT FOUND")
else:
    content = re.sub(bulk_upload_pattern, bulk_upload_replacement, content)
    print("Replaced bulk_upload_students pattern")

with open(r"api/server.py", "w", encoding="utf-8") as f:
    f.write(content)

