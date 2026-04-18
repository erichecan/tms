-- Migration 006: Drop redundant password_hash column — 2026-04-17
-- AuthService uses `password` as the canonical bcrypt hash column.
-- Migration 005 already synced password_hash -> password for all existing rows.

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
