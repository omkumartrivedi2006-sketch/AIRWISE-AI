# AIRWISE AI — Production Database Backup & Recovery Strategy

This document establishes the backup schedule, point-in-time recovery (PITR), offsite snapshots, and non-destructive recovery testing procedures for the production database.

---

## 1. Automated Snapshot Policy

| Backup Type | Frequency | Retention Period | Storage Location | Automated? |
| :--- | :--- | :--- | :--- | :--- |
| **Daily Snapshots** | Every 24 hours (02:00 UTC) | 30 days | Encrypted cloud object storage | Yes (Host-managed) |
| **Point-in-Time Recovery (PITR)** | Continuous WAL archiving | 7 days | Private cloud storage | Yes (Standard tier) |
| **Weekly Offsite Export** | Every Sunday | 90 days | Independent secure cloud bucket | Automated / CLI |

---

## 2. Manual Logical Backup (pg_dump)

To perform an on-demand logical backup prior to running schema migrations or major updates:

```bash
# Export compressed PostgreSQL database archive
pg_dump -h <host> -U <username> -d airwise_db -F c -b -v -f "airwise_backup_$(date +%Y%m%d_%H%M%S).dump"
```

To create a clean SQL script backup:
```bash
pg_dump -h <host> -U <username> -d airwise_db --no-owner --no-acl -f "airwise_schema_data.sql"
```

---

## 3. Safe Recovery Procedure (Zero-Overwriting Rule)

> [!CAUTION]
> Never restore directly into the live production database (`airwise_db`). Always restore into an isolated staging database first to verify data integrity.

### Step-by-Step Restoration
1. Provision a temporary staging database, e.g. `airwise_db_restore_test`.
2. Restore the dump archive into the staging database:
   ```bash
   pg_restore -h <host> -U <username> -d airwise_db_restore_test -v "airwise_backup_YYYYMMDD_HHMMSS.dump"
   ```
3. Run verification queries to ensure row count parity across core tables:
   ```sql
   SELECT 'users' AS tbl, COUNT(*) FROM users
   UNION ALL
   SELECT 'pollution_observations', COUNT(*) FROM pollution_observations
   UNION ALL
   SELECT 'audit_logs', COUNT(*) FROM audit_logs;
   ```
4. Only after integrity verification, switch database connection strings during a scheduled maintenance window.
