import re

with open("api/routers/jee_mock.py", "r", encoding="utf-8") as f:
    content = f.read()

# The pattern is:
#     conn = get_db_connection()
#     try:
#         with conn.cursor() as cursor:
# Replace with:
#     with get_db_connection() as conn:
#         try:
#             with conn.cursor() as cursor:

# It's actually easier to replace:
# "    conn = get_db_connection()\n    try:\n        with conn.cursor() as cursor:"
# But we need to fix the indentation for the rest of the try block.
# Actually, an easier fix that doesn't change indentation of the entire try block:
# Just change `conn = get_db_connection()` to `with get_db_connection() as conn:`
# and leave `try:` where it is, but then `try:` would be indented.
# Alternatively, I can just write a quick script that replaces `conn = get_db_connection()`
# with a dummy wrapper or changes `get_db_connection` behavior to not be a context manager?
# No, `server.py` relies on it being a context manager in other places like:
# `with get_db_connection() as conn:` 

# Let's write a targeted string replacement for the exact blocks:

lines = content.split('\n')
out_lines = []
i = 0
while i < len(lines):
    if "conn = get_db_connection()" in lines[i] and i+1 < len(lines) and "try:" in lines[i+1]:
        indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
        out_lines.append(indent + "with get_db_connection() as conn:")
        out_lines.append(indent + "    try:")
        
        # Now we need to indent everything until `finally:`
        i += 2
        while i < len(lines):
            if lines[i].startswith(indent + "finally:"):
                out_lines.append(indent + "    finally:")
                i += 1
                while i < len(lines) and (not lines[i].strip() or lines[i].startswith(indent + "    ")):
                    # It's inside finally
                    out_lines.append("    " + lines[i] if lines[i].strip() else lines[i])
                    i += 1
                break
            else:
                if lines[i].strip():
                    out_lines.append("    " + lines[i])
                else:
                    out_lines.append(lines[i])
            i += 1
        continue
    else:
        out_lines.append(lines[i])
    i += 1

with open("api/routers/jee_mock.py", "w", encoding="utf-8") as f:
    f.write('\n'.join(out_lines))
print("Fixed jee_mock.py!")
