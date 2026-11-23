"""
AIRWISE AI — Admin Creation Convenience Wrapper
Usage:
    python scripts/create_admin.py --email admin@airwise.ai --name "Admin User"
"""

import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.cli.admin import main

if __name__ == "__main__":
    main()
