import re

def patch_frontend():
    # 1. Patch AdminDashboard.jsx
    with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
        admin_content = f.read()

    # Update state and initial data
    admin_content = admin_content.replace('total_courses', 'total_classes')
    admin_content = admin_content.replace('departmentsList', 'classesList')
    admin_content = admin_content.replace('setDepartmentsList', 'setClassesList')
    admin_content = admin_content.replace('apiClient.get("/departments")', 'apiClient.get("/classes")')
    
    # Update stats rendering
    admin_content = admin_content.replace('{stats.total_courses || 0}', '{stats.total_classes || 0}')
    
    # Remove department tabs entirely by replacing the departments tab block
    # We will let the user use a new Classes & Sections page instead.
    admin_content = re.sub(r'<TabsTrigger value="departments".*?</TabsTrigger>', '', admin_content, flags=re.DOTALL)
    admin_content = re.sub(r'<TabsContent value="departments">.*?</TabsContent>', '', admin_content, flags=re.DOTALL)

    with open('src/pages/AdminDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(admin_content)

if __name__ == "__main__":
    patch_frontend()
