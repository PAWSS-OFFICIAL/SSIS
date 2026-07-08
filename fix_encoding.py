import os
import codecs

files_to_fix = [
    r"src/pages/AttendancePage.jsx",
    r"src/pages/AttemptQuizPage.jsx",
    r"src/pages/CreateQuizPage.jsx"
]

def fix_file(filepath):
    try:
        # Try reading as UTF-16 (common PowerShell output)
        try:
            with open(filepath, 'r', encoding='utf-16') as f:
                content = f.read()
            print(f"Read {filepath} as UTF-16")
        except UnicodeError:
            # Fallback to UTF-8 (maybe with BOM)
            with open(filepath, 'r', encoding='utf-8-sig') as f:
                content = f.read()
            print(f"Read {filepath} as UTF-8-SIG")

        # Write back as clean UTF-8
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed encoding for {filepath}")
        
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

if __name__ == "__main__":
    for f in files_to_fix:
        if os.path.exists(f):
            fix_file(f)
        else:
            print(f"File not found: {f}")
