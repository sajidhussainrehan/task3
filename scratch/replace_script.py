import os

def replace_in_file(file_path, replacements):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for old, new in replacements.items():
            new_content = new_content.replace(old, new)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")
    except Exception as e:
        pass

replacements = {
    "بارع": "بارع",
    "Bariaa": "Bariaa",
    "Bariaa": "Bariaa"
}

for root, dirs, files in os.walk('.'):
    # Skip potential bin/node_modules/git directories
    if any(skip in root for skip in ['node_modules', '.git', '.next', 'build', 'dist']):
        continue
    
    for file in files:
        if file.endswith(('.js', '.html', '.py', '.json', '.css', '.md')):
            replace_in_file(os.path.join(root, file), replacements)
