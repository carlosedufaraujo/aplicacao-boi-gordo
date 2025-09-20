#!/usr/bin/env python3
import re
import os

def fix_switch_statements(file_path):
    """Fix switch statement syntax errors in TypeScript files."""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False

    with open(file_path, 'r') as f:
        content = f.read()

    original_content = content

    # Pattern 1: Fix case statements with opening brace on next line
    # case 'something':\n      {
    pattern1 = re.compile(r'(\s*case\s+[^:]+:)\s*\n\s*\{(\s*\n)', re.MULTILINE)
    content = pattern1.sub(r'\1\2', content)

    # Pattern 2: Fix case statements that are missing break statements
    # Look for cases where we have:
    # case 'x':
    # {
    #   return something;
    # case 'y':
    pattern2 = re.compile(r'(case\s+[^:]+:)\s*\n\s*\{\s*\n(\s*return[^;]+;)\s*\n\s*(case\s+)', re.MULTILINE)
    content = pattern2.sub(r'\1\n\2\n      \3', content)

    # Pattern 3: Remove orphan closing braces before case statements
    pattern3 = re.compile(r'\}\s*\n(\s*case\s+)', re.MULTILINE)
    content = pattern3.sub(r'\n\1', content)

    # Pattern 4: Fix double closing braces at the end of switch statements
    pattern4 = re.compile(r'(\}\s*\n\s*)\}\s*\n\s*\}', re.MULTILINE)
    content = pattern4.sub(r'\1}', content)

    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

# List of files that still have errors
files_to_fix = [
    "src/components/Lots/CompleteLots.tsx",
    "src/components/Lots/PenMapIntegrated.tsx",
    "src/components/Modals/StatusChangeModal.tsx",
    "src/components/Registrations/ModernRegistrations.tsx",
    "src/components/System/SystemUpdates.tsx",
    "src/components/System/UserManagement.tsx",
]

for file_path in files_to_fix:
    if fix_switch_statements(file_path):
        print(f"Fixed: {file_path}")
    else:
        print(f"No changes needed: {file_path}")