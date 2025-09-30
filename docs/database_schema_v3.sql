-- MySQL schema for Code Adventurers platform (v3.0 - Normalized)
-- This version extracts critical JSON fields into proper columns for better querying and indexing.

DROP DATABASE IF EXISTS code_adventurers;
CREATE DATABASE code_adventurers CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE code_adventurers;

-- ============================================================
-- Core User Tables
-- ============================================================

-- Users table with normalized fields
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  role ENUM('student', 'teacher', 'parent', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_name (name),
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone)
) ENGINE=InnoDB;

-- Students table (extends users)
CREATE TABLE students (
  user_id VARCHAR(64) PRIMARY KEY,
  class_id VARCHAR(64) DEFAULT NULL,
  invite_code VARCHAR(32) DEFAULT NULL,
  sandbox_unlocked BOOLEAN DEFAULT FALSE,
  avatar_equipped VARCHAR(64) DEFAULT 'starter-cape',
  total_stars INT DEFAULT 0,
  total_completed_levels INT DEFAULT 0,
  settings_volume INT DEFAULT 80,
  settings_low_motion BOOLEAN DEFAULT FALSE,
  settings_language VARCHAR(10) DEFAULT 'zh-CN',
  settings_resettable BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_students_class (class_id),
  INDEX idx_students_invite (invite_code)
) ENGINE=InnoDB;

-- Avatar items unlocked by students
CREATE TABLE student_avatars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  avatar_item VARCHAR(64) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_avatar (student_id, avatar_item),
  INDEX idx_student_avatars_student (student_id)
) ENGINE=InnoDB;

-- Achievements/badges earned by students
CREATE TABLE student_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  badge_code VARCHAR(64) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_badge (student_id, badge_code),
  INDEX idx_student_badges_student (student_id)
) ENGINE=InnoDB;

-- Compendium entries collected by students
CREATE TABLE student_compendium (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  entry_id VARCHAR(64) NOT NULL,
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_compendium (student_id, entry_id),
  INDEX idx_student_compendium_student (student_id)
) ENGINE=InnoDB;

-- Teachers table (extends users)
CREATE TABLE teachers (
  user_id VARCHAR(64) PRIMARY KEY,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Parents table (extends users)
CREATE TABLE parents (
  user_id VARCHAR(64) PRIMARY KEY,
  reminder_time VARCHAR(10) DEFAULT '20:00',
  weekly_report_day VARCHAR(10) DEFAULT 'Sunday',
  notify_channels JSON DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Parent-child relationships
CREATE TABLE parent_children (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id VARCHAR(64) NOT NULL,
  child_id VARCHAR(64) NOT NULL,
  relationship VARCHAR(20) DEFAULT 'parent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(user_id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES students(user_id) ON DELETE CASCADE,
  UNIQUE KEY uk_parent_child (parent_id, child_id),
  INDEX idx_parent_children_parent (parent_id),
  INDEX idx_parent_children_child (child_id)
) ENGINE=InnoDB;

-- ============================================================
-- Class Management
-- ============================================================

CREATE TABLE classes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  invite_code VARCHAR(32) NOT NULL,
  teacher_id VARCHAR(64) NOT NULL,
  hint_limit INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_classes_teacher (teacher_id),
  UNIQUE KEY uk_classes_invite (invite_code)
) ENGINE=InnoDB;

-- Class-Course assignments
CREATE TABLE class_courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id VARCHAR(64) NOT NULL,
  course_id VARCHAR(64) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_class_course (class_id, course_id),
  INDEX idx_class_courses_class (class_id),
  INDEX idx_class_courses_course (course_id)
) ENGINE=InnoDB;

-- ============================================================
-- Course Structure
-- ============================================================

CREATE TABLE courses (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT DEFAULT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_courses_order (display_order)
) ENGINE=InnoDB;

CREATE TABLE chapters (
  id VARCHAR(64) PRIMARY KEY,
  course_id VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  summary TEXT DEFAULT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_chapters_course (course_id),
  INDEX idx_chapters_order (display_order)
) ENGINE=InnoDB;

CREATE TABLE levels (
  id VARCHAR(64) PRIMARY KEY,
  chapter_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  best_steps INT DEFAULT 0,
  comic TEXT DEFAULT NULL,
  display_order INT DEFAULT 0,
  -- Level configuration stored as JSON for complex nested structures
  start_position JSON NOT NULL,
  goal_config JSON NOT NULL,
  tiles JSON NOT NULL,
  hints JSON DEFAULT NULL,
  allowed_blocks JSON DEFAULT NULL,
  rewards JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  INDEX idx_levels_chapter (chapter_id),
  INDEX idx_levels_order (display_order)
) ENGINE=InnoDB;

-- ============================================================
-- Student Progress Tracking
-- ============================================================

-- Individual level progress records
CREATE TABLE student_level_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  level_id VARCHAR(64) NOT NULL,
  status ENUM('locked', 'unlocked', 'in-progress', 'completed', 'in-review') DEFAULT 'locked',
  stars INT DEFAULT 0,
  best_steps INT DEFAULT NULL,
  best_difference INT DEFAULT NULL,
  hints_used INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  attempts INT DEFAULT 0,
  last_replay_log JSON DEFAULT NULL,
  first_completed_at TIMESTAMP NULL,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_level (student_id, level_id),
  INDEX idx_progress_student (student_id),
  INDEX idx_progress_level (level_id),
  INDEX idx_progress_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- Sandbox & Submissions
-- ============================================================

CREATE TABLE sandbox_projects (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  title VARCHAR(128) DEFAULT 'Untitled Project',
  code TEXT DEFAULT NULL,
  thumbnail_url VARCHAR(255) DEFAULT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  INDEX idx_sandbox_student (student_id),
  INDEX idx_sandbox_public (is_public)
) ENGINE=InnoDB;

CREATE TABLE work_submissions (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  class_id VARCHAR(64) DEFAULT NULL,
  level_id VARCHAR(64) DEFAULT NULL,
  title VARCHAR(128) DEFAULT NULL,
  content JSON DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  teacher_feedback TEXT DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL,
  INDEX idx_submissions_student (student_id),
  INDEX idx_submissions_class (class_id),
  INDEX idx_submissions_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- Content & Reports
-- ============================================================

CREATE TABLE compendium_entries (
  id VARCHAR(64) PRIMARY KEY,
  chapter_id VARCHAR(64) DEFAULT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT DEFAULT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
  INDEX idx_compendium_chapter (chapter_id)
) ENGINE=InnoDB;

CREATE TABLE weekly_reports (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  summary TEXT DEFAULT NULL,
  concepts_learned JSON DEFAULT NULL,
  common_mistakes JSON DEFAULT NULL,
  recommendations JSON DEFAULT NULL,
  FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE,
  INDEX idx_reports_student (student_id),
  INDEX idx_reports_date (generated_at)
) ENGINE=InnoDB;

-- ============================================================
-- Asset Management
-- ============================================================

CREATE TABLE asset_records (
  id VARCHAR(64) PRIMARY KEY,
  asset_type VARCHAR(32) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_size BIGINT DEFAULT 0,
  mime_type VARCHAR(64) DEFAULT NULL,
  uploader_id VARCHAR(64) DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_assets_type (asset_type),
  INDEX idx_assets_uploader (uploader_id)
) ENGINE=InnoDB;

CREATE TABLE export_records (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  export_type VARCHAR(32) NOT NULL,
  file_path VARCHAR(512) DEFAULT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_exports_user (user_id),
  INDEX idx_exports_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- Helper Views
-- ============================================================

CREATE OR REPLACE VIEW v_student_overview AS
SELECT
  u.id,
  u.name,
  s.class_id,
  s.total_stars,
  s.total_completed_levels,
  s.sandbox_unlocked,
  s.avatar_equipped,
  c.name AS class_name
FROM users u
JOIN students s ON u.id = s.user_id
LEFT JOIN classes c ON s.class_id = c.id
WHERE u.role = 'student';

CREATE OR REPLACE VIEW v_class_summary AS
SELECT
  c.id,
  c.name,
  c.invite_code,
  c.teacher_id,
  u.name AS teacher_name,
  c.hint_limit,
  COUNT(DISTINCT s.user_id) AS student_count
FROM classes c
LEFT JOIN users u ON c.teacher_id = u.id
LEFT JOIN students s ON c.id = s.class_id
GROUP BY c.id, c.name, c.invite_code, c.teacher_id, u.name, c.hint_limit;

CREATE OR REPLACE VIEW v_level_statistics AS
SELECT
  l.id AS level_id,
  l.name AS level_name,
  l.chapter_id,
  COUNT(slp.id) AS attempt_count,
  COUNT(CASE WHEN slp.status = 'completed' THEN 1 END) AS completion_count,
  AVG(CASE WHEN slp.status = 'completed' THEN slp.best_steps END) AS avg_steps,
  AVG(CASE WHEN slp.status = 'completed' THEN slp.stars END) AS avg_stars
FROM levels l
LEFT JOIN student_level_progress slp ON l.id = slp.level_id
GROUP BY l.id, l.name, l.chapter_id;
