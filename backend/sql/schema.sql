-- ============================================================
-- SkillBridge (Skill-Swap-Network) - P0 database schema
-- MySQL 8.4 LTS, InnoDB, utf8mb4
--
-- Usage (from backend/ directory):
--   mysql -u root -p < sql/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS skill_swap_network
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE skill_swap_network;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(120)    NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  created_at    TIMESTAMP(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    TIMESTAMP(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- MVP: skills catalog, user skill links, swap requests
-- (additive only - the users table and its data are untouched)
-- ------------------------------------------------------------

-- Canonical skill catalog (shared vocabulary across all users)
CREATE TABLE IF NOT EXISTS skills (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name       VARCHAR(80)   NOT NULL,
  created_at TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_name (name)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Skills a user can TEACH
CREATE TABLE IF NOT EXISTS user_skills (
  user_id    INT UNSIGNED  NOT NULL,
  skill_id   INT UNSIGNED  NOT NULL,
  created_at TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, skill_id),
  CONSTRAINT fk_user_skills_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_user_skills_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Skills a user WANTS TO LEARN
CREATE TABLE IF NOT EXISTS user_wanted_skills (
  user_id    INT UNSIGNED  NOT NULL,
  skill_id   INT UNSIGNED  NOT NULL,
  created_at TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, skill_id),
  CONSTRAINT fk_user_wanted_user   FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_user_wanted_skill  FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Swap requests between two users (pending -> accepted | declined)
CREATE TABLE IF NOT EXISTS swap_requests (
  id                        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  requester_id              INT UNSIGNED  NOT NULL,
  recipient_id              INT UNSIGNED  NOT NULL,
  skill_requester_teaches   INT UNSIGNED  NOT NULL,
  skill_recipient_teaches   INT UNSIGNED  NOT NULL,
  status                    ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
  created_at                TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at                TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_swap_requests_requester (requester_id),
  KEY idx_swap_requests_recipient (recipient_id),
  CONSTRAINT fk_swap_requester           FOREIGN KEY (requester_id)            REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_swap_recipient           FOREIGN KEY (recipient_id)            REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_swap_skill_req_teaches   FOREIGN KEY (skill_requester_teaches) REFERENCES skills (id) ON DELETE CASCADE,
  CONSTRAINT fk_swap_skill_rec_teaches   FOREIGN KEY (skill_recipient_teaches) REFERENCES skills (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
