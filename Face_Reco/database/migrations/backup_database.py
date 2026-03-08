"""
Database Backup Script
Creates backups of academic_years and subjects tables before migration
"""
from database.client import SupabaseClient
import json
from datetime import datetime
import os


def backup_table(db: SupabaseClient, table_name: str, output_file: str):
    """Backup a table to JSON file"""
    print(f"Backing up {table_name}...")
    try:
        response = db.client.table(table_name).select('*').execute()
        
        backup_data = {
            'table': table_name,
            'timestamp': datetime.now().isoformat(),
            'record_count': len(response.data),
            'data': response.data
        }
        
        with open(output_file, 'w') as f:
            json.dump(backup_data, f, indent=2, default=str)
        
        print(f"✓ Backed up {len(response.data)} records to {output_file}")
        return True
    except Exception as e:
        print(f"✗ Error backing up {table_name}: {e}")
        return False


def main():
    """Create backups of critical tables"""
    print("=" * 60)
    print("Database Backup - Pre-Migration")
    print("=" * 60)
    
    try:
        db = SupabaseClient()
        
        # Create backups directory if it doesn't exist
        backup_dir = 'database/migrations/backups'
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Backup academic_years
        ay_backup = f"{backup_dir}/academic_years_{timestamp}.json"
        if not backup_table(db, 'academic_years', ay_backup):
            print("\n✗ Backup failed")
            return False
        
        # Backup subjects
        subj_backup = f"{backup_dir}/subjects_{timestamp}.json"
        if not backup_table(db, 'subjects', subj_backup):
            print("\n✗ Backup failed")
            return False
        
        print("\n" + "=" * 60)
        print("✓ Backup completed successfully")
        print(f"Backup files:")
        print(f"  - {ay_backup}")
        print(f"  - {subj_backup}")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n✗ Backup failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)
