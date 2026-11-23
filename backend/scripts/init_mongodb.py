"""
AIRWISE AI — MongoDB Database Initialization Script
Initializes MongoDB collections, performance/unique indexes, and auto-increment sequence counters.
Usage:
    python backend/scripts/init_mongodb.py
"""

import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.database import get_mongodb_client, init_db_indexes
from app.core.logging import logger


def init_mongodb() -> None:
    print("=" * 60)
    print("AIRWISE AI — Initializing MongoDB Database")
    print(f"Target URI: {settings.MONGODB_URI}")
    print(f"Database:   {settings.DB_NAME}")
    print("=" * 60)

    try:
        client = get_mongodb_client()
        # Verify connectivity
        client.admin.command("ping")
        print("[SUCCESS] Connected to MongoDB cluster successfully.")
    except Exception as exc:
        print(f"[ERROR] Failed to connect to MongoDB: {exc}")
        print("[HINT] Ensure MongoDB is running locally or check MONGODB_URI in backend/.env")
        sys.exit(1)

    db = client[settings.DB_NAME]

    # Initialize collections and indexes
    print("\n[STEP 1/3] Applying collection indexes and unique constraints...")
    init_db_indexes(db)
    print(" -> Unique indexes applied for users (email), tokens, and reviews.")
    print(" -> Compound & search indexes applied for locations and observations.")

    # Initialize sequence counters
    print("\n[STEP 2/3] Verifying auto-increment sequence counters...")
    counters_coll = db["counters"]
    required_sequences = [
        "users",
        "locations",
        "pollution_observations",
        "conversations",
        "messages",
        "feedback",
        "refresh_tokens",
        "password_reset_tokens",
        "email_verification_tokens",
        "user_preferences",
        "saved_locations",
        "alert_rules",
        "notifications",
        "push_subscriptions",
        "recommendation_cache",
        "audit_logs",
        "environmental_reviews",
    ]

    for seq in required_sequences:
        existing = counters_coll.find_one({"_id": seq})
        if not existing:
            # Determine current max ID in collection if existing data present
            target_coll = db[seq]
            highest = target_coll.find_one(sort=[("id", -1)])
            start_seq = highest["id"] if highest and "id" in highest and isinstance(highest["id"], int) else 0
            counters_coll.update_one(
                {"_id": seq},
                {"$setOnInsert": {"seq": start_seq}},
                upsert=True,
            )
            print(f" -> Initialized sequence counter for '{seq}' at {start_seq}.")
        else:
            print(f" -> Sequence counter for '{seq}' already active at {existing.get('seq', 0)}.")

    print("\n[STEP 3/3] Database health telemetry verification...")
    server_info = client.server_info()
    version = server_info.get("version", "unknown")
    print(f"[SUCCESS] MongoDB version {version} initialized and ready for AIRWISE AI operations.")
    print("=" * 60)


if __name__ == "__main__":
    init_mongodb()
