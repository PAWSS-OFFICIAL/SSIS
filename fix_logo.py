import os

folder = r'e:\JAIN-LMS_-main\JAIN-LMS_-main\public\pylearn'
search_str = '<div class="logo-pill"><span class="logo-cadet">Cadet</span><span class="logo-x">X</span></div>'
replace_str = '<img src="/logo.jpg" alt="SSIS Logo" style="height:24px; border-radius:4px; margin-right:8px;" />'

for filename in os.listdir(folder):
    if filename.endswith('.html'):
        filepath = os.path.join(folder, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if search_str in content:
            new_content = content.replace(search_str, replace_str)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filename}')
