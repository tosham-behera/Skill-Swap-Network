-- ============================================================
-- SkillBridge - one-time migration: Completed Exchanges feature
--
-- Extends swap_requests.status with the 'completed' value so an
-- accepted exchange can be marked as done. No tables are added
-- or removed; existing rows and their statuses are untouched.
--
-- Fresh installs do NOT need this file (schema.sql already
-- includes the new ENUM value).
--
-- Usage (from backend/ directory):
--   mysql -u root -p < sql/migrate-completed-status.sql
-- ============================================================

USE skill_swap_network;

ALTER TABLE swap_requests
  MODIFY COLUMN status
    ENUM('pending', 'accepted', 'declined', 'completed')
    NOT NULL DEFAULT 'pending';
