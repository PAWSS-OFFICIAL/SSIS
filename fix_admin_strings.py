import os

def fix_admin():
    filepath = 'src/pages/AdminDashboard.jsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. User filtering leftover: "All Departments" to "All Classes"
    content = content.replace('All Departments', 'All Classes')
    content = content.replace('placeholder="Select Department"', 'placeholder="Select Class"')
    content = content.replace('Select Department', 'Select Class')
    content = content.replace('Override Department', 'Override Class')
    
    # 2. Fix the user filtering logic mapping: dept.code -> c.name
    # I see classesList.map(dept => ( <SelectItem key={dept.id} value={dept.code}>{dept.code}</SelectItem> ))
    # Replace dept.code with dept.name, or rather c.id and c.name
    content = content.replace('value={dept.code}>{dept.code}', 'value={dept.id.toString()}>{dept.name}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_admin()
