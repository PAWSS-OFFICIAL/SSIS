import re

def fix_courses_page():
    with open('src/pages/CoursesPage.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace departments with classes
    content = content.replace('departmentsList', 'classesList')
    content = content.replace('setDepartmentsList', 'setClassesList')
    content = content.replace('apiClient.get("/departments")', 'apiClient.get("/classes")')
    
    with open('src/pages/CoursesPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_courses_page()
