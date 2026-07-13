import re

with open(r"api/server.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update create_user
create_user_pattern = r"                import datetime\s*current_year = datetime\.datetime\.now\(\)\.year\s*raw_pw = f\"SSIS\{current_year\}\{user\.idno\}\""
create_user_replacement = """                import datetime
                current_year = datetime.datetime.now().year
                raw_pw = str(user.idno)
                if not raw_pw.upper().startswith("SSIS"):
                    raw_pw = f"SSIS{current_year}{raw_pw}\""""
content = re.sub(create_user_pattern, create_user_replacement, content)

# 2. Update bulk_upload
bulk_pattern = r"                    import datetime\s*current_year = datetime\.datetime\.now\(\)\.year\s*raw_pw = f\"SSIS\{current_year\}\{usn\}\""
bulk_replacement = """                    import datetime
                    current_year = datetime.datetime.now().year
                    raw_pw = str(usn)
                    if not raw_pw.upper().startswith("SSIS"):
                        raw_pw = f"SSIS{current_year}{raw_pw}\""""
content = re.sub(bulk_pattern, bulk_replacement, content)

with open(r"api/server.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched!")
