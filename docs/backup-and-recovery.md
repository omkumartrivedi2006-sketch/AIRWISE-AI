# AIRWISE AI — Database Backup, Recovery & Disaster Restoration

**Document:** `docs/backup-and-recovery.md`  
**Date:** November 21, 2026  
**Status:** Verified Operational Procedure  

---

## 1. Overview & Recovery Objectives

This document specifies the official disaster recovery, automated snapshot, and manual restoration procedures for the AIRWISE AI PostgreSQL production database.

- **Recovery Point Objective (RPO)**: Maximum 1 hour of environmental observations and user transactions.
- **Recovery Time Objective (RTO)**: Sub-15 minutes restoration to a standby or recovered PostgreSQL instance.

---

## 2. Automated Cloud Backup Strategies

When hosted on managed cloud PostgreSQL providers (AWS RDS, Supabase, Neon, GCP Cloud SQL):
1. **Automated Daily Snapshots**: Retained for 30 rolling days with automatic encryption at rest.
2. **Write-Ahead Logging (WAL) & Point-In-Time Recovery (PITR)**: Enables continuous log replication allowing recovery to any specific second in the preceding 7 days.

---

## 3. Manual Backup Procedures (`pg_dump`)

### 3.1 Logical Backup Script
To generate an immediate, compressed snapshot of the production schema and data:

```bash
# Set database connection parameters
export PGHOST="your-db-host.internal"
export PGPORT="5432"
export PGUSER="airwise_admin"
export PGDATABASE="airwise_db"

# Create timestamped dump
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
pg_dump -Fc --no-owner --no-acl airwise_db > "airwise_backup_${TIMESTAMP}.dump"
```

### 3.2 Schema-Only Backup
```bash
pg_dump --schema-only airwise_db > "airwise_schema_${TIMESTAMP}.sql"
```

---

## 4. Disaster Recovery & Restoration Procedure (`pg_restore`)

> [!WARNING]
> Never execute a restoration against an active production database without explicit administrative confirmation and team coordination.

### 4.1 Restoring to a Fresh Standby Database
```bash
# 1. Provision fresh target database
createdb -h target-host -U airwise_admin airwise_recovered_db

# 2. Restore from custom format archive
pg_restore -h target-host -U airwise_admin -d airwise_recovered_db -v "airwise_backup_20261121_120000.dump"

# 3. Validate Alembic migration head matches codebase
alembic current
alembic upgrade head

# 4. Perform sanity row count check
SELECT count(*) FROM users;
SELECT count(*) FROM pollution_observations;
```

---

## 5. Verification & Integrity Checklist

After any restore procedure:
- [ ] Verify foreign key constraints are valid (`users`, `locations`, `pollution_observations`).
- [ ] Confirm `alembic_version` matches current migration revision (`005_admin_audit_and_reviews`).
- [ ] Execute `GET /api/v1/health/ready` to verify application connectivity.
- [ ] Verify latest timestamp in `pollution_observations` is intact.
