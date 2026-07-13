import re

with open(r"api/server.py", "r", encoding="utf-8") as f:
    content = f.read()

bulk_upload_pattern = r"                    usn = str\(row_dict\['usn'\]\)\.upper\(\)\s*usn_digits = ''\.join\(filter\(str\.isdigit, usn\)\)\[-5:\]  # Last 5 digits\s*email = f\"\{usn\.lower\(\)\}@ssis\.edu\.in\"\s*username = row_dict\['student_name'\]\.replace\(' ', ''\)\.lower\(\)\s*student_hashed_pw = bcrypt\.hashpw\(usn\.encode\('utf-8'\), bcrypt\.gensalt\(\)\)\.decode\('utf-8'\)"

bulk_upload_replacement = """                    usn = str(row_dict['usn']).upper()
                    usn_digits = ''.join(filter(str.isdigit, usn))[-5:]  # Last 5 digits
                    email = f"{usn.lower()}@ssis.edu.in"
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

