import os

pages = [
    "ReportCardPage",
    "CoursesConfigPage",
    "ClassroomPage",
    "ExamHallLocatorPage",
    "AnnouncementsPage"
]

template = """import React from "react";
import { DashboardLayout } from "../components/DashboardLayout";

export const {name} = () => {
  return (
    <DashboardLayout role="Admin">
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-slate-800">{name.replace('Page', '')}</h1>
        <p>This module is currently under construction.</p>
      </div>
    </DashboardLayout>
  );
};
"""

def generate_placeholders():
    for page in pages:
        filename = f"src/pages/{page}.jsx"
        if not os.path.exists(filename):
            with open(filename, "w", encoding="utf-8") as f:
                f.write(template.replace("{name}", page))

if __name__ == "__main__":
    generate_placeholders()
