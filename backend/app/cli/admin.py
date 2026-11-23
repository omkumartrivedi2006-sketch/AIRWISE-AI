"""
AIRWISE AI — Admin Account Management CLI
Provides controlled, secure administrative provisioning without hardcoded credentials or plaintext secrets.
Usage:
    python -m app.cli.admin create --email admin@airwise.ai --name "Platform Admin"
    python -m app.cli.admin promote --email user@airwise.ai
"""

import argparse
import getpass
import sys
from datetime import datetime, timezone
from app.core.database import MongoSession as Session
from app.core.database import SessionLocal
from app.core.security import hash_password, validate_password_strength
from app.models.user import User


def create_admin_account(email: str, full_name: str, password: str = None) -> bool:
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower().strip()).first()
        if existing:
            if existing.role == "ADMIN":
                print(f"[INFO] User '{email}' already exists and is already an administrator.")
                return True
            print(f"[INFO] User '{email}' already exists with role '{existing.role}'. Promoting to 'ADMIN'...")
            existing.role = "ADMIN"
            existing.is_active = True
            existing.is_verified = True
            db.commit()
            print(f"[SUCCESS] User '{email}' successfully promoted to ADMIN.")
            return True

        # Need password for new user
        if not password:
            password = getpass.getpass("Enter administrator password: ")
            confirm = getpass.getpass("Confirm administrator password: ")
            if password != confirm:
                print("[ERROR] Passwords do not match. Aborting.")
                return False

        valid, err_msg = validate_password_strength(password)
        if not valid:
            print(f"[ERROR] Password does not meet security requirements: {err_msg}")
            return False

        hashed = hash_password(password)
        admin_user = User(
            email=email.lower().strip(),
            full_name=full_name.strip(),
            password_hash=hashed,
            role="ADMIN",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(admin_user)
        db.commit()
        print(f"[SUCCESS] Administrator '{email}' created successfully.")
        return True
    except Exception as e:
        db.rollback()
        print(f"[FATAL] Failed to create administrator: {e}")
        return False
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="AIRWISE AI Administrator Provisioning CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    create_parser = subparsers.add_parser("create", help="Create a new administrator account")
    create_parser.add_argument("--email", required=True, help="Administrator email address")
    create_parser.add_argument("--name", default="System Administrator", help="Administrator full name")
    create_parser.add_argument("--password", required=False, help="Administrator password (prompted securely if omitted)")

    promote_parser = subparsers.add_parser("promote", help="Promote an existing user to administrator")
    promote_parser.add_argument("--email", required=True, help="User email address to promote")

    args = parser.parse_args()

    if args.command == "create":
        success = create_admin_account(args.email, args.name, args.password)
        sys.exit(0 if success else 1)
    elif args.command == "promote":
        success = create_admin_account(args.email, full_name="", password="dummy_not_needed_for_existing")
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
