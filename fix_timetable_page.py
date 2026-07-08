import re

def fix_timetable_page():
    with open('src/pages/TimetablePage.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace states
    content = content.replace('const [departments, setDepartments] = useState([]);', 'const [classes, setClasses] = useState([]);')
    content = content.replace('const [selectedDept, setSelectedDept] = useState("");', 'const [selectedClass, setSelectedClass] = useState("");')
    
    # Replace API calls
    content = content.replace('apiClient.get("/departments")', 'apiClient.get("/classes")')
    
    # Replace map variables
    content = content.replace('const depts = deptsRes.data;', 'const classesData = deptsRes.data;')
    content = content.replace('setDepartments(depts);', 'setClasses(classesData);')
    content = content.replace('if (!selectedDept && depts.length > 0) {', 'if (!selectedClass && classesData.length > 0) {')
    content = content.replace('setSelectedDept(depts[0].code);', 'setSelectedClass(classesData[0].id.toString());')
    
    # Fix the Select component for departments
    content = content.replace('departments.length > 0', 'classes.length > 0')
    content = content.replace('departments.map(d =>', 'classes.map(d =>')
    content = content.replace('value={d.code}>{d.code}<', 'value={d.id.toString()}>{d.name}<')
    
    # Replace value={selectedDept} onValueChange={setSelectedDept}
    content = content.replace('value={selectedDept} onValueChange={setSelectedDept}', 'value={selectedClass} onValueChange={setSelectedClass}')

    with open('src/pages/TimetablePage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_timetable_page()
