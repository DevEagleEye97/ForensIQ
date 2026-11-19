"""
ForensIQ Automated Vault Database Backup Utility
Copies forensiq_vault.db to backups/ directory with timestamped filenames.
Retains 7 most recent backups for point-in-time recovery.
"""

import os
import shutil
import glob
from datetime import datetime, timezone
from typing import Dict, Any


def run_vault_backup(db_path: str = "forensiq_vault.db", backups_dir: str = "backups") -> Dict[str, Any]:
    """
    Creates a timestamped snapshot of the SQLite evidence vault.
    """
    os.makedirs(backups_dir, exist_ok=True)

    if not os.path.exists(db_path):
        return {
            "status": "error",
            "message": f"Database file not found at {db_path}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    now_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"forensiq_vault_{now_str}.db"
    backup_dest = os.path.join(backups_dir, backup_filename)

    # Perform atomic-like copy
    shutil.copy2(db_path, backup_dest)
    size_bytes = os.path.getsize(backup_dest)

    # Retention enforcement: keep 7 most recent
    existing = sorted(glob.glob(os.path.join(backups_dir, "forensiq_vault_*.db")))
    removed = []
    if len(existing) > 7:
        to_delete = existing[:-7]
        for f in to_delete:
            try:
                os.remove(f)
                removed.append(os.path.basename(f))
            except Exception:
                pass

    return {
        "status": "ok",
        "backup_file": backup_filename,
        "backup_path": backup_dest,
        "size_bytes": size_bytes,
        "size_kb": round(size_bytes / 1024, 2),
        "total_backups_retained": min(7, len(existing)),
        "pruned_backups": removed,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    result = run_vault_backup()
    import json
    print(json.dumps(result, indent=2))
