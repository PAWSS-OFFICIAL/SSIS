import os
import glob

def patch_usn():
    pages_dir = 'src/pages'
    files = glob.glob(os.path.join(pages_dir, '*.jsx'))
    
    for file in files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(file, 'r', encoding='utf-16') as f:
                content = f.read()
            
        original = content
        
        # Replace USN string occurrences where appropriate
        content = content.replace('<TableHead>USN</TableHead>', '<TableHead>Roll Number</TableHead>')
        content = content.replace('USN:', 'Roll Number:')
        content = content.replace('USN ', 'Roll Number ')
        content = content.replace('(USN)', '(Roll Number)')
        content = content.replace('>USN<', '>Roll Number<')
        
        content = content.replace('.usn', '.roll_no')
        content = content.replace('usn: ', 'roll_no: ')
        content = content.replace('{usn}', '{roll_no}')
        
        if content != original:
            # write back with same encoding
            try:
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(content)
            except Exception:
                with open(file, 'w', encoding='utf-16') as f:
                    f.write(content)
            print(f"Patched {file}")

if __name__ == '__main__':
    patch_usn()
