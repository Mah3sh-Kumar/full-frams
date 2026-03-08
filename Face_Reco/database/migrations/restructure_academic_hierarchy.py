"""
Data Migration: Restructure Academic Hierarchy
This script reorganizes the academic hierarchy to follow the proper structure:
Department → Branch (Program) → Class (Year Level) → Student

Current incorrect structure:
- Branches are duplicated for each class/year
- No department-branch relationship
- Branches reference classes instead of classes referencing branches

Target structure:
- Each branch (program) belongs to one department
- Each class (year level) belongs to one branch
- Each student belongs to one class
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Dict, List, Set

# Load environment variables
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)


def get_department_mapping() -> Dict[str, str]:
    """Map program types to department IDs based on naming patterns"""
    
    # Fetch departments
    response = supabase.table("org_departments").select("*").execute()
    departments = {dept['code']: dept['id'] for dept in response.data}
    
    # Define program to department mapping
    program_to_dept = {
        # Science programs
        'bsc': departments.get('science_dept') or departments.get('cs2026'),
        'physics': departments.get('science_dept') or departments.get('cs2026'),
        'chemistry': departments.get('science_dept') or departments.get('cs2026'),
        'biotech': departments.get('science_dept') or departments.get('cs2026'),
        'cs': departments.get('science_dept') or departments.get('cs2026'),
        'it': departments.get('science_dept') or departments.get('cs2026'),
        
        # Commerce programs
        'bcom': departments.get('commerce_dept'),
        'bms': departments.get('commerce_dept'),
        'baf': departments.get('commerce_dept'),
        'bbi': departments.get('commerce_dept'),
        
        # Arts programs
        'ba': departments.get('arts_dept'),
        'history': departments.get('arts_dept'),
        'economics': departments.get('arts_dept'),
        'psychology': departments.get('arts_dept'),
        'languages': departments.get('arts_dept'),
        
        # Law programs
        'llb': departments.get('law_dept'),
    }
    
    return program_to_dept


def extract_program_from_branch(branch_name: str, branch_code: str) -> str:
    """Extract the base program name from branch name/code"""
    # Remove year suffixes and common patterns
    code_lower = branch_code.lower()
    name_lower = branch_name.lower()
    
    # Check for specific programs
    if 'physics' in code_lower or 'physics' in name_lower:
        return 'physics'
    elif 'chemistry' in code_lower or 'chemistry' in name_lower:
        return 'chemistry'
    elif 'biotech' in code_lower or 'biotech' in name_lower:
        return 'biotech'
    elif 'computer' in name_lower or 'cs_' in code_lower:
        return 'cs'
    elif 'information' in name_lower or 'it_' in code_lower:
        return 'it'
    elif 'bcom' in code_lower or 'b.com' in name_lower:
        return 'bcom'
    elif 'bms' in code_lower or 'bms' in name_lower:
        return 'bms'
    elif 'baf' in code_lower or 'baf' in name_lower:
        return 'baf'
    elif 'bbi' in code_lower or 'bbi' in name_lower:
        return 'bbi'
    elif 'history' in code_lower or 'history' in name_lower:
        return 'history'
    elif 'economics' in code_lower or 'economics' in name_lower:
        return 'economics'
    elif 'psychology' in code_lower or 'psychology' in name_lower:
        return 'psychology'
    elif 'languages' in code_lower or 'languages' in name_lower:
        return 'languages'
    elif 'llb' in code_lower or 'll.b' in name_lower:
        return 'llb'
    elif 'bsc' in code_lower or 'b.sc' in name_lower:
        return 'bsc'
    elif 'ba' in code_lower or 'b.a' in name_lower:
        return 'ba'
    
    return 'unknown'


def consolidate_branches() -> Dict[str, str]:
    """
    Consolidate duplicate branches into unique programs
    Returns mapping of old branch IDs to new consolidated branch IDs
    """
    
    # Fetch all branches
    response = supabase.table("branches").select("*").execute()
    branches = response.data
    
    # Get department mapping
    dept_mapping = get_department_mapping()
    
    # Group branches by program type
    program_branches: Dict[str, List[dict]] = {}
    
    for branch in branches:
        program = extract_program_from_branch(branch['name'], branch['code'])
        if program not in program_branches:
            program_branches[program] = []
        program_branches[program].append(branch)
    
    # Create consolidated branches and mapping
    old_to_new_mapping: Dict[str, str] = {}
    
    for program, branch_list in program_branches.items():
        if not branch_list:
            continue
            
        # Use the first branch as the canonical one (without year suffix)
        canonical = None
        for b in branch_list:
            # Prefer branches without year suffixes in code
            if not any(suffix in b['code'] for suffix in ['_fy', '_sy', '_ty']):
                canonical = b
                break
        
        if not canonical:
            canonical = branch_list[0]
        
        # Determine department
        dept_id = dept_mapping.get(program)
        
        # Update the canonical branch with department
        if dept_id:
            supabase.table("branches").update({
                "department_id": dept_id
            }).eq("id", canonical['id']).execute()
        
        # Map all old branches to the canonical one
        for branch in branch_list:
            old_to_new_mapping[branch['id']] = canonical['id']
    
    return old_to_new_mapping


def update_class_relationships(branch_mapping: Dict[str, str]):
    """Update classes to reference the correct consolidated branches"""
    
    # Fetch all branches with their class relationships
    response = supabase.table("branches").select("id, class_id").execute()
    branches = response.data
    
    # Update each class to reference its branch
    for branch in branches:
        if branch['class_id']:
            new_branch_id = branch_mapping.get(branch['id'], branch['id'])
            
            # Update the class to reference the branch
            supabase.table("classes").update({
                "branch_id": new_branch_id
            }).eq("id", branch['class_id']).execute()
            
            print(f"Updated class {branch['class_id']} to reference branch {new_branch_id}")


def remove_duplicate_branches(branch_mapping: Dict[str, str]):
    """Remove duplicate branches that have been consolidated"""
    
    # Get unique canonical branch IDs
    canonical_branches = set(branch_mapping.values())
    
    # Delete branches that are not canonical
    for old_id, new_id in branch_mapping.items():
        if old_id != new_id:
            # This is a duplicate, delete it
            supabase.table("branches").delete().eq("id", old_id).execute()
            print(f"Deleted duplicate branch {old_id} (consolidated into {new_id})")


def verify_hierarchy():
    """Verify the hierarchy is correctly structured"""
    
    print("\n=== Verification Report ===\n")
    
    # Check departments
    dept_response = supabase.table("org_departments").select("*").execute()
    print(f"Total Departments: {len(dept_response.data)}")
    
    # Check branches with departments
    branch_response = supabase.table("branches").select("id, name, department_id").execute()
    branches_with_dept = [b for b in branch_response.data if b['department_id']]
    branches_without_dept = [b for b in branch_response.data if not b['department_id']]
    
    print(f"Total Branches: {len(branch_response.data)}")
    print(f"  - With Department: {len(branches_with_dept)}")
    print(f"  - Without Department: {len(branches_without_dept)}")
    
    # Check classes with branches
    class_response = supabase.table("classes").select("id, name, branch_id").execute()
    classes_with_branch = [c for c in class_response.data if c['branch_id']]
    classes_without_branch = [c for c in class_response.data if not c['branch_id']]
    
    print(f"Total Classes: {len(class_response.data)}")
    print(f"  - With Branch: {len(classes_with_branch)}")
    print(f"  - Without Branch: {len(classes_without_branch)}")
    
    # Check students with classes
    student_response = supabase.table("students").select("id, class_id").execute()
    students_with_class = [s for s in student_response.data if s['class_id']]
    students_without_class = [s for s in student_response.data if not s['class_id']]
    
    print(f"Total Students: {len(student_response.data)}")
    print(f"  - With Class: {len(students_with_class)}")
    print(f"  - Without Class: {len(students_without_class)}")
    
    print("\n=== Sample Hierarchy ===\n")
    
    # Show sample hierarchy
    hierarchy_response = supabase.rpc("get_academic_hierarchy_sample").execute()
    # Or use the view
    view_response = supabase.table("v_academic_hierarchy").select("*").limit(10).execute()
    
    for row in view_response.data[:5]:
        print(f"Dept: {row.get('department_name')} → Branch: {row.get('branch_name')} → Class: {row.get('class_name')}")


def main():
    """Main migration execution"""
    
    print("Starting Academic Hierarchy Restructuring...")
    print("=" * 60)
    
    # Step 1: Consolidate branches
    print("\nStep 1: Consolidating duplicate branches...")
    branch_mapping = consolidate_branches()
    print(f"Consolidated {len(branch_mapping)} branches into {len(set(branch_mapping.values()))} unique programs")
    
    # Step 2: Update class relationships
    print("\nStep 2: Updating class-branch relationships...")
    update_class_relationships(branch_mapping)
    
    # Step 3: Remove duplicates
    print("\nStep 3: Removing duplicate branches...")
    remove_duplicate_branches(branch_mapping)
    
    # Step 4: Verify
    print("\nStep 4: Verifying hierarchy...")
    verify_hierarchy()
    
    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("\nNext steps:")
    print("1. Update application queries to use the new hierarchy")
    print("2. Test filtering: Department → Branch → Class → Student")
    print("3. Remove the old 'class_id' column from branches table")


if __name__ == "__main__":
    main()
