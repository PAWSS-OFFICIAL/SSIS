import re

def patch_app_js():
    with open('src/App.js', 'r', encoding='utf-8') as f:
        content = f.read()

    imports = """import { ClassesConfigPage } from "./pages/ClassesConfigPage";
import { ReportCardPage } from "./pages/ReportCardPage";
import { CoursesConfigPage } from "./pages/CoursesConfigPage";
import { ClassroomPage } from "./pages/ClassroomPage";
import { ExamHallLocatorPage } from "./pages/ExamHallLocatorPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
"""
    if "ClassesConfigPage" not in content:
        content = re.sub(r'import \{ AdminDashboard \}', imports + 'import { AdminDashboard }', content)

    routes = """
          <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={["Admin"]}><ClassesConfigPage /></ProtectedRoute>} />
          <Route path="/admin/report-cards" element={<ProtectedRoute allowedRoles={["Admin"]}><ReportCardPage /></ProtectedRoute>} />
          <Route path="/admin/courses-config" element={<ProtectedRoute allowedRoles={["Admin"]}><CoursesConfigPage /></ProtectedRoute>} />
          <Route path="/admin/classrooms" element={<ProtectedRoute allowedRoles={["Admin"]}><ClassroomPage /></ProtectedRoute>} />
          <Route path="/admin/exam-halls" element={<ProtectedRoute allowedRoles={["Admin"]}><ExamHallLocatorPage /></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={["Admin"]}><AnnouncementsPage /></ProtectedRoute>} />
"""
    if "/admin/classes" not in content:
        content = re.sub(
            r'(<Route path="/admin" element=\{.*?</ProtectedRoute>\s*\n\s*\}) />',
            r'\1 />' + routes,
            content,
            flags=re.DOTALL
        )

    with open('src/App.js', 'w', encoding='utf-8') as f:
        f.write(content)

def patch_sidebar():
    with open('src/components/DashboardLayout.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # The user asked to:
    # Rename "Course" -> "Report Card"
    # Rename "Grades" -> "Courses"
    # Add Timetable, Classroom, Exam Hall Locator, Announcements
    
    # Let's find the ADMIN_MENU
    if "ADMIN_MENU =" in content:
        new_admin_menu = """const ADMIN_MENU = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { title: "Users", icon: Users, path: "/admin/users" },
  { title: "Classes & Sections", icon: BookOpen, path: "/admin/classes" },
  { title: "Report Card", icon: GraduationCap, path: "/admin/report-cards" },
  { title: "Timetable", icon: CalendarDays, path: "/admin/timetable" },
  { title: "Courses", icon: FileText, path: "/admin/courses-config" },
  { title: "Classroom", icon: Users, path: "/admin/classrooms" },
  { title: "Exam Hall Locator", icon: Search, path: "/admin/exam-halls" },
  { title: "Announcements", icon: Bell, path: "/admin/announcements" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];"""
        content = re.sub(r'const ADMIN_MENU = \[.*?\];', new_admin_menu, content, flags=re.DOTALL)
        
        # Add Search and Bell icons if missing
        if "Search," not in content:
            content = content.replace("import {", "import { Search, Bell, ")

        with open('src/components/DashboardLayout.jsx', 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    patch_app_js()
    patch_sidebar()
