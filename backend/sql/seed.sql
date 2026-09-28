-- ============================================================
-- SkillBridge - demo seed data (OPTIONAL, run manually)
--
-- Creates 4 demo users (password for all: password123) with
-- teach/learn skills and one pre-accepted swap request so the
-- dashboard has something to show immediately.
--
-- Safe to run once. Uses INSERT ... ON DUPLICATE KEY UPDATE /
-- INSERT IGNORE, so re-running does not duplicate rows.
-- Nothing here runs automatically at server start.
--
-- Usage:
--   cd backend
--   mysql -u root -p < sql/seed.sql
-- ============================================================

USE skill_swap_network;

-- ------------------------------------------------------------
-- Demo users (password: password123)
-- ------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash) VALUES
  ('Aarav Sharma',  'aarav@college.edu',  '$2b$10$tULC1/iNpkvEkziTbFHMauP3.FVhOQi9MtcMg0skF5rzOfc5Qx34S'),
  ('Meera Iyer',    'meera@college.edu',  '$2b$10$tULC1/iNpkvEkziTbFHMauP3.FVhOQi9MtcMg0skF5rzOfc5Qx34S'),
  ('Dev Patel',     'dev@college.edu',    '$2b$10$tULC1/iNpkvEkziTbFHMauP3.FVhOQi9MtcMg0skF5rzOfc5Qx34S'),
  ('Sara Khan',     'sara@college.edu',   '$2b$10$tULC1/iNpkvEkziTbFHMauP3.FVhOQi9MtcMg0skF5rzOfc5Qx34S')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- ------------------------------------------------------------
-- Skill catalog
-- ------------------------------------------------------------
INSERT INTO skills (name) VALUES
  ('React'), ('JavaScript'), ('Python'), ('Java'),
  ('UI Design'), ('SQL'), ('Node.js'), ('Public Speaking'),
  ('Data Structures'), ('Figma'), ('Git'), ('Machine Learning')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ------------------------------------------------------------
-- Who teaches what (user_skills)
-- ------------------------------------------------------------
INSERT IGNORE INTO user_skills (user_id, skill_id)
SELECT u.id, s.id FROM users u, skills s
WHERE (u.email = 'aarav@college.edu' AND s.name IN ('Java', 'Data Structures', 'SQL'))
   OR (u.email = 'meera@college.edu' AND s.name IN ('React', 'UI Design', 'Figma'))
   OR (u.email = 'dev@college.edu'   AND s.name IN ('Python', 'Machine Learning', 'SQL'))
   OR (u.email = 'sara@college.edu'  AND s.name IN ('JavaScript', 'Node.js', 'Git'));

-- ------------------------------------------------------------
-- Who wants to learn what (user_wanted_skills)
-- ------------------------------------------------------------
INSERT IGNORE INTO user_wanted_skills (user_id, skill_id)
SELECT u.id, s.id FROM users u, skills s
WHERE (u.email = 'aarav@college.edu' AND s.name IN ('React', 'UI Design'))
   OR (u.email = 'meera@college.edu' AND s.name IN ('Java', 'SQL'))
   OR (u.email = 'dev@college.edu'   AND s.name IN ('React', 'JavaScript'))
   OR (u.email = 'sara@college.edu'  AND s.name IN ('Python', 'Public Speaking'));

-- ------------------------------------------------------------
-- One pre-accepted swap for demo continuity:
-- Aarav teaches Meera Java; Meera teaches Aarav React.
-- ------------------------------------------------------------
INSERT IGNORE INTO swap_requests (requester_id, recipient_id, skill_requester_teaches, skill_recipient_teaches, status)
SELECT m.id, r.id, sj.id, sr.id, 'accepted'
FROM users m, users r, skills sj, skills sr
WHERE m.email = 'meera@college.edu'
  AND r.email = 'aarav@college.edu'
  AND sj.name = 'Java'
  AND sr.name = 'React';
