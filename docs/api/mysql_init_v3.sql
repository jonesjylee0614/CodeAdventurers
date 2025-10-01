-- Initial dataset for Code Adventurers platform (v3.0 - Normalized)
USE code_adventurers;

-- ============================================================
-- Insert Users
-- ============================================================

-- Teachers
INSERT INTO users (id, name, email, role) VALUES
  ('teacher-1', '李老师', 'li.teacher@example.com', 'teacher'),
  ('teacher-2', '王老师', 'wang.teacher@example.com', 'teacher')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO teachers (user_id) VALUES
  ('teacher-1'),
  ('teacher-2')
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- Parents
INSERT INTO users (id, name, email, role) VALUES
  ('parent-1', '陈妈妈', 'chen.parent@example.com', 'parent'),
  ('parent-2', '刘爸爸', 'liu.parent@example.com', 'parent'),
  ('parent-3', '赵妈妈', 'zhao.parent@example.com', 'parent')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO parents (user_id, reminder_time, weekly_report_day) VALUES
  ('parent-1', '20:00', 'Sunday'),
  ('parent-2', '19:30', 'Saturday'),
  ('parent-3', '21:00', 'Sunday')
ON DUPLICATE KEY UPDATE reminder_time = VALUES(reminder_time);

-- Admin
INSERT INTO users (id, name, email, role) VALUES
  ('admin-1', '系统管理员', 'admin@codeadventurers.com', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Students
INSERT INTO users (id, name, role) VALUES
  ('student-1', '小奇', 'student'),
  ('student-2', '小睿', 'student'),
  ('student-3', '小敏', 'student'),
  ('student-4', '小豪', 'student')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- Insert Classes
-- ============================================================

INSERT INTO classes (id, name, invite_code, teacher_id, hint_limit) VALUES
  ('class-1', '一(1)班', 'CA-CLASS-1', 'teacher-1', 3),
  ('class-2', '一(2)班', 'CA-CLASS-2', 'teacher-1', 5),
  ('class-3', '二(1)班', 'CA-CLASS-3', 'teacher-2', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- Insert Students with Class Assignments
-- ============================================================

INSERT INTO students (user_id, class_id, invite_code, sandbox_unlocked, avatar_equipped, 
                      total_stars, total_completed_levels, settings_volume, settings_low_motion, 
                      settings_language, settings_resettable) VALUES
  ('student-1', 'class-1', 'CA-CLASS-1', FALSE, 'starter-cape', 0, 0, 80, FALSE, 'zh-CN', TRUE),
  ('student-2', 'class-1', 'CA-CLASS-1', TRUE, 'starter-helmet', 5, 2, 60, TRUE, 'zh-CN', TRUE),
  ('student-3', 'class-2', 'CA-CLASS-2', FALSE, 'starter-cape', 6, 2, 100, FALSE, 'zh-CN', TRUE),
  ('student-4', 'class-3', 'CA-CLASS-3', TRUE, 'starter-boots', 6, 2, 70, FALSE, 'zh-CN', TRUE)
ON DUPLICATE KEY UPDATE class_id = VALUES(class_id);

-- ============================================================
-- Setup Student Avatars
-- ============================================================

INSERT INTO student_avatars (student_id, avatar_item) VALUES
  ('student-1', 'starter-cape'),
  ('student-2', 'starter-cape'),
  ('student-2', 'starter-helmet'),
  ('student-3', 'starter-cape'),
  ('student-3', 'starter-boots'),
  ('student-4', 'starter-boots')
ON DUPLICATE KEY UPDATE student_id = VALUES(student_id);

-- ============================================================
-- Setup Student Badges
-- ============================================================

INSERT INTO student_badges (student_id, badge_code) VALUES
  ('student-2', 'first-gem'),
  ('student-3', 'logic-starter'),
  ('student-4', 'first-gem'),
  ('student-4', 'loop-master')
ON DUPLICATE KEY UPDATE student_id = VALUES(student_id);

-- ============================================================
-- Setup Parent-Child Relationships
-- ============================================================

INSERT INTO parent_children (parent_id, child_id, relationship) VALUES
  ('parent-1', 'student-1', 'parent'),
  ('parent-2', 'student-2', 'parent'),
  ('parent-3', 'student-3', 'parent'),
  ('parent-3', 'student-4', 'parent')
ON DUPLICATE KEY UPDATE relationship = VALUES(relationship);

-- ============================================================
-- Insert Courses
-- ============================================================

INSERT INTO courses (id, name, description, display_order) VALUES
  ('course-1', '顺序指令入门', '面向低年级的顺序与条件指令课程,共 3 章。', 1),
  ('course-2', '循环与调试进阶', '通过循环与调试巩固顺序思维,共 2 章。', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- Assign Courses to Classes
-- ============================================================

INSERT INTO class_courses (class_id, course_id) VALUES
  ('class-1', 'course-1'),
  ('class-2', 'course-1'),
  ('class-2', 'course-2'),
  ('class-3', 'course-2')
ON DUPLICATE KEY UPDATE class_id = VALUES(class_id);

-- ============================================================
-- Insert Chapters
-- ============================================================

INSERT INTO chapters (id, course_id, title, summary, display_order) VALUES
  ('chapter-1', 'course-1', '第一章:顺序与方位', '学习基本的移动和方向指令', 1),
  ('chapter-2', 'course-1', '第二章:条件与选择', '掌握条件判断和分支逻辑', 2),
  ('chapter-3', 'course-2', '第一章:循环初探', '理解循环的基本概念', 1),
  ('chapter-4', 'course-2', '第二章:调试技巧', '学会使用调试工具排查问题', 2)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ============================================================
-- Insert Levels
-- ============================================================

INSERT INTO levels (id, chapter_id, name, width, height, best_steps, comic, display_order,
                    start_position, goal_config, tiles, hints, allowed_blocks, rewards) VALUES
  ('level-1', 'chapter-1', '首关演示', 3, 3, 3, '小奇需要学会向前走到宝石旁。', 1,
   '{"x":0,"y":0,"facing":"east"}',
   '{"reach":{"x":2,"y":1},"collectibles":1,"stepLimit":10}',
   '[{"x":0,"y":0,"walkable":true},{"x":1,"y":0,"walkable":true},{"x":2,"y":0,"walkable":true},{"x":2,"y":1,"walkable":true,"collectible":"gem"},{"x":2,"y":2,"walkable":true}]',
   '["向前移动","拾取宝石","回到出口"]',
   '["MOVE","TURN_LEFT","TURN_RIGHT"]',
   '{"stars":3,"outfit":"starter-boots"}'),
   
  ('level-2', 'chapter-2', '岔路口的选择', 4, 4, 8, '小奇来到岔路,需要判断正确的方向。', 1,
   '{"x":0,"y":0,"facing":"east"}',
   '{"reach":{"x":3,"y":2},"collectibles":1,"stepLimit":18}',
   '[{"x":0,"y":0,"walkable":true},{"x":1,"y":0,"walkable":true},{"x":2,"y":0,"walkable":true},{"x":2,"y":1,"walkable":true,"collectible":"gem"},{"x":2,"y":2,"walkable":true,"trigger":{"type":"switch","id":"S1"}},{"x":3,"y":2,"walkable":true}]',
   '["观察两条路径","使用条件判断是否需要转弯","拾取宝石后再前进"]',
   '["MOVE","TURN_LEFT","TURN_RIGHT","IF_PATH_AHEAD"]',
   '{"stars":3,"outfit":"decision-cloak"}'),
   
  ('level-3', 'chapter-2', '守卫的巡逻', 5, 5, 10, '守卫巡逻的时间点需要精准掌握。', 2,
   '{"x":0,"y":2,"facing":"east"}',
   '{"reach":{"x":4,"y":3},"collectibles":1,"stepLimit":22}',
   '[{"x":0,"y":2,"walkable":true},{"x":1,"y":2,"walkable":true},{"x":2,"y":2,"walkable":true,"collectible":"gem"},{"x":3,"y":2,"walkable":true},{"x":4,"y":2,"walkable":true},{"x":4,"y":3,"walkable":true}]',
   '["守卫会定时出现","利用条件语句等待时机","注意步数限制"]',
   '["MOVE","TURN_LEFT","TURN_RIGHT","IF_ENEMY_AHEAD","WAIT"]',
   '{"stars":3,"outfit":"stealth-hood"}'),
   
  ('level-4', 'chapter-3', '重复的桥段', 4, 3, 6, '桥上布满宝石,重复指令显得乏味。', 1,
   '{"x":0,"y":1,"facing":"east"}',
   '{"reach":{"x":3,"y":1},"collectibles":3,"stepLimit":14}',
   '[{"x":0,"y":1,"walkable":true},{"x":1,"y":1,"walkable":true,"collectible":"gem"},{"x":2,"y":1,"walkable":true,"collectible":"gem"},{"x":3,"y":1,"walkable":true,"collectible":"gem"}]',
   '["重复的路径可以用循环解决","确保循环次数正确","别忘记拾取所有宝石"]',
   '["MOVE","TURN_LEFT","TURN_RIGHT","LOOP_TIMES"]',
   '{"stars":3,"outfit":"loop-gloves"}'),
   
  ('level-5', 'chapter-3', '嵌套迷宫', 5, 4, 12, '复杂的迷宫需要组合循环。', 2,
   '{"x":0,"y":0,"facing":"east"}',
   '{"reach":{"x":4,"y":2},"collectibles":1,"stepLimit":28}',
   '[{"x":0,"y":0,"walkable":true},{"x":1,"y":0,"walkable":true},{"x":2,"y":0,"walkable":true,"collectible":"gem"},{"x":2,"y":1,"walkable":true},{"x":2,"y":2,"walkable":true},{"x":3,"y":2,"walkable":true},{"x":4,"y":2,"walkable":true}]',
   '["考虑循环嵌套","先完成内圈","利用调试观察路径"]',
   '["MOVE","TURN_LEFT","TURN_RIGHT","LOOP_TIMES","LOOP_WHILE_PATH"]',
   '{"stars":3,"outfit":"maze-cloak"}'),
   
  ('level-6', 'chapter-4', '调试实验室', 4, 4, 11, '实验室提供调试终端,逐步排查问题。', 1,
   '{"x":0,"y":0,"facing":"east"}',
   '{"reach":{"x":3,"y":3},"collectibles":1,"stepLimit":24}',
   '[{"x":0,"y":0,"walkable":true},{"x":1,"y":0,"walkable":true},{"x":1,"y":1,"walkable":true,"collectible":"gem"},{"x":1,"y":2,"walkable":true},{"x":1,"y":3,"walkable":true},{"x":2,"y":3,"walkable":true},{"x":3,"y":3,"walkable":true}]',
   '["先写出可能出错的解法","使用调试逐步执行","修正循环条件"]',
   '["MOVE","TURN_LEFT","TURN_RIGHT","LOOP_TIMES","BREAK_LOOP","DEBUG_PRINT"]',
   '{"stars":3,"outfit":"debug-visor"}')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================================
-- Insert Student Progress
-- ============================================================

-- Student 1: Completed level-1
INSERT INTO student_level_progress (student_id, level_id, status, stars, best_steps, best_difference, 
                                   hints_used, total_duration, attempts, first_completed_at) VALUES
  ('student-1', 'level-1', 'completed', 3, 3, 0, 0, 120, 1, NOW() - INTERVAL 2 DAY)
ON DUPLICATE KEY UPDATE stars = VALUES(stars);

-- Student 2: Completed level-1 and level-2
INSERT INTO student_level_progress (student_id, level_id, status, stars, best_steps, best_difference, 
                                   hints_used, total_duration, attempts, first_completed_at) VALUES
  ('student-2', 'level-1', 'completed', 3, 3, 0, 0, 90, 1, NOW() - INTERVAL 5 DAY),
  ('student-2', 'level-2', 'completed', 2, 10, 2, 1, 180, 2, NOW() - INTERVAL 3 DAY)
ON DUPLICATE KEY UPDATE stars = VALUES(stars);

-- Student 3: Completed level-1, in progress on level-4
INSERT INTO student_level_progress (student_id, level_id, status, stars, best_steps, best_difference, 
                                   hints_used, total_duration, attempts, first_completed_at) VALUES
  ('student-3', 'level-1', 'completed', 3, 4, 1, 1, 150, 2, NOW() - INTERVAL 7 DAY),
  ('student-3', 'level-4', 'in-progress', 0, NULL, NULL, 0, 60, 1, NULL)
ON DUPLICATE KEY UPDATE stars = VALUES(stars);

-- Student 4: Completed level-4 and level-5
INSERT INTO student_level_progress (student_id, level_id, status, stars, best_steps, best_difference, 
                                   hints_used, total_duration, attempts, first_completed_at) VALUES
  ('student-4', 'level-4', 'completed', 3, 6, 0, 0, 100, 1, NOW() - INTERVAL 4 DAY),
  ('student-4', 'level-5', 'completed', 3, 13, 1, 1, 200, 2, NOW() - INTERVAL 2 DAY),
  ('student-4', 'level-6', 'in-review', 0, NULL, NULL, 0, 80, 1, NULL)
ON DUPLICATE KEY UPDATE stars = VALUES(stars);

-- ============================================================
-- Insert Compendium Entries
-- ============================================================

INSERT INTO compendium_entries (id, chapter_id, name, description) VALUES
  ('artifact-1', 'chapter-1', '初始罗盘', '帮助冒险者辨别方向的罗盘,通关第一章后获得。'),
  ('artifact-2', 'chapter-3', '循环权杖', '掌握循环后获得的权杖,可缩短重复操作的时间。'),
  ('artifact-3', 'chapter-4', '调试晶体', '记录程序每一步状态的晶体,帮助发现错误。')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert collected compendium for students
INSERT INTO student_compendium (student_id, entry_id) VALUES
  ('student-2', 'artifact-1'),
  ('student-4', 'artifact-2')
ON DUPLICATE KEY UPDATE student_id = VALUES(student_id);

-- ============================================================
-- Insert Weekly Reports
-- ============================================================

INSERT INTO weekly_reports (id, student_id, generated_at, summary, concepts_learned, 
                           common_mistakes, recommendations) VALUES
  ('report-student-1', 'student-1', NOW() - INTERVAL 1 DAY, 
   '本周完成首关,并学习了前进指令。',
   '["顺序执行","方向判断"]',
   '["忘记拾取宝石"]',
   '["巩固前进与拾取操作"]'),
   
  ('report-student-2', 'student-2', NOW() - INTERVAL 1 DAY,
   '掌握了条件判断,能独立选择正确路径。',
   '["条件判断","简单循环"]',
   '["循环次数多加一次"]',
   '["继续练习条件语句的嵌套"]'),
   
  ('report-student-3', 'student-3', NOW() - INTERVAL 1 DAY,
   '尝试了进阶课程,对循环有初步理解。',
   '["顺序执行","循环基础"]',
   '["忘记重置变量"]',
   '["使用调试模式观察变量变化"]'),
   
  ('report-student-4', 'student-4', NOW() - INTERVAL 1 DAY,
   '完成了循环进阶章节,并成功调试了错误。',
   '["循环嵌套","调试技巧"]',
   '["初次编写时遗漏收集宝石"]',
   '["挑战自定义关卡,巩固调试思维"]')
ON DUPLICATE KEY UPDATE summary = VALUES(summary);
