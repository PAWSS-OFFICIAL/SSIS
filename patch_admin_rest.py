import re

def patch_admin_dashboard_rest():
    with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. New user state
    # Replace idno, department, year, section with idno, class_id, section_id
    if 'idno: "",\n    department: "",' in content:
        content = content.replace('idno: "",\n    department: "",\n    year: "",\n    section: ""', 'idno: "",\n    class_id: "",\n    section_id: ""')

    if 'idno: "",\n        department: "",' in content:
        content = content.replace('idno: "",\n        department: "",\n        year: "",\n        section: ""', 'idno: "",\n        class_id: "",\n        section_id: ""')

    # Add sections list state
    if "const [sectionsList, setSectionsList] = useState([]);" not in content:
        content = content.replace('const [classesList, setClassesList] = useState([]);', 
                                  'const [classesList, setClassesList] = useState([]);\n  const [sectionsList, setSectionsList] = useState([]);')

    # Bulk Upload Modal changes
    content = content.replace('student_name, usn, department, year, section', 'student_name, roll_no, class_id, section_id')
    content = content.replace('usn@jainuniversity.ac.in', 'roll_no@ssis.edu.in')
    content = content.replace('placeholder="john@jainuniversity.ac.in"', 'placeholder="john@ssis.edu.in"')

    # Last 5 digits of USN -> Last 5 digits of Roll Number
    content = content.replace('Last 5 digits of USN', 'Last 5 digits of Roll No.')
    
    # Table headers
    content = content.replace('<TableHead>USN</TableHead>', '<TableHead>Roll Number</TableHead>')
    content = content.replace('record.usn', 'record.usn || record.roll_no')
    
    with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch_admin_dashboard_rest()
