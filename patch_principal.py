import os

def replace_in_file(filepath, replacements):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(filepath, 'r', encoding='utf-16') as f:
            content = f.read()
            
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
        
    if content != original:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        except Exception:
            with open(filepath, 'w', encoding='utf-16') as f:
                f.write(content)
        print(f"Patched {filepath}")

def patch_principal():
    # 1. PrincipalDashboard.jsx
    replace_in_file('src/pages/PrincipalDashboard.jsx', [
        ('HODDashboard', 'PrincipalDashboard'),
        ('HOD Dashboard', 'Principal Dashboard'),
        ('HOD Actions', 'Principal Actions'),
        ('Summon from HOD', 'Summon from Principal'),
        ('Department Overview', 'School Overview'),
        ('department', 'school'),
        ('Department', 'School'),
        ('/hod/', '/principal/')
    ])
    
    # 2. App.js router
    replace_in_file('src/App.js', [
        ('HODDashboard', 'PrincipalDashboard'),
        ('"/hod"', '"/principal"')
    ])
    
    # 3. DashboardLayout.jsx
    replace_in_file('src/components/DashboardLayout.jsx', [
        ('HOD Dashboard', 'Principal Dashboard'),
        ('"/hod"', '"/principal"')
    ])

if __name__ == '__main__':
    patch_principal()
