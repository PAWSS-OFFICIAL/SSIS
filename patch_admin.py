import re

def patch_admin_dashboard():
    with open('src/pages/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. New user state
    # Replace idno, department, year, section with idno, class_id, section_id
    content = content.replace('idno: "",', 'idno: "",\n    class_id: "",\n    section_id: "",')
    content = content.replace('department: "",', '')
    content = content.replace('year: "",', '')
    content = content.replace('section: ""', '')

    # reset new user
    content = content.replace('idno: "",\n        department: "",\n        year: "",\n        section: ""', 'idno: "",\n        class_id: "",\n        section_id: ""')

    # Add sections list state
    if "const [sectionsList, setSectionsList] = useState([]);" not in content:
        content = content.replace('const [classesList, setClassesList] = useState([]);', 
                                  'const [classesList, setClassesList] = useState([]);\n  const [sectionsList, setSectionsList] = useState([]);')

    # The form inside <div className="grid grid-cols-2 gap-4 mt-4">
    # Let's replace the whole block starting from `<Label>USN</Label>` up to `</>`.
    
    old_usn_block = """<div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>USN</Label>
                              <Input
                                value={newUser.idno}
                                onChange={(e) => setNewUser({ ...newUser, idno: e.target.value })}
                                placeholder="JUUG25BTECH00001"
                                data-testid="new-user-usn"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Year <span className="text-red-500">*</span></Label>
                              <Select value={newUser.year} onValueChange={(v) => setNewUser({ ...newUser, year: v })}>
                                <SelectTrigger className={!newUser.year ? "border-red-300" : ""}>
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {years.map(y => (
                                    <SelectItem key={y} value={y}>Year {y}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>Section <span className="text-red-500">*</span></Label>
                              <Select value={newUser.section} onValueChange={(v) => setNewUser({ ...newUser, section: v })}>
                                <SelectTrigger className={!newUser.section ? "border-red-300" : ""}>
                                  <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sections.map(s => (
                                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Department</Label>
                              <Select value={newUser.department} onValueChange={(v) => setNewUser({ ...newUser, department: v })}>
                                <SelectTrigger data-testid="new-user-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classesList.map(dept => (
                                    <SelectItem key={dept.id} value={dept.code}>{dept.code} - {dept.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>"""

    new_school_block = """<div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>Roll Number</Label>
                              <Input
                                value={newUser.idno}
                                onChange={(e) => setNewUser({ ...newUser, idno: e.target.value })}
                                placeholder="R0001"
                                data-testid="new-user-usn"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Class <span className="text-red-500">*</span></Label>
                              <Select value={newUser.class_id} onValueChange={async (v) => {
                                setNewUser({ ...newUser, class_id: v, section_id: "" });
                                const res = await apiClient.get(`/classes/${v}/sections`);
                                setSectionsList(res.data);
                              }}>
                                <SelectTrigger className={!newUser.class_id ? "border-red-300" : ""}>
                                  <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classesList.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label>Section <span className="text-red-500">*</span></Label>
                              <Select value={newUser.section_id} onValueChange={(v) => setNewUser({ ...newUser, section_id: v })} disabled={!newUser.class_id || sectionsList.length === 0}>
                                <SelectTrigger className={!newUser.section_id ? "border-red-300" : ""}>
                                  <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent>
                                  {sectionsList.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                            </div>
                          </div>"""
                          
    if old_usn_block in content:
        content = content.replace(old_usn_block, new_school_block)
    else:
        print("Warning: old_usn_block not found in AdminDashboard.jsx")
        
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
    patch_admin_dashboard()
