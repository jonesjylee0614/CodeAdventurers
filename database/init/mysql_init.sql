-- Initial dataset aligned with backend domain defaults
USE code_adventurers;

INSERT INTO users (id, data) VALUES
  ('teacher-1', JSON_OBJECT(
    'id', 'teacher-1',
    'name', '李老师',
    'role', 'teacher',
    'managedClassIds', JSON_ARRAY('class-1'),
    'courseIds', JSON_ARRAY('course-1')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO users (id, data) VALUES
  ('parent-1', JSON_OBJECT(
    'id', 'parent-1',
    'name', '陈妈妈',
    'role', 'parent',
    'childIds', JSON_ARRAY('student-1')
  )),
  ('admin-1', JSON_OBJECT(
    'id', 'admin-1',
    'name', '系统管理员',
    'role', 'admin'
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO users (id, data) VALUES
  ('student-1', JSON_OBJECT(
    'id', 'student-1',
    'name', '小奇',
    'role', 'student',
    'classId', 'class-1',
    'inviteCode', 'CA-CLASS-1',
    'avatar', JSON_OBJECT('equipped', 'starter-cape', 'unlocked', JSON_ARRAY('starter-cape')),
    'achievements', JSON_OBJECT('badges', JSON_ARRAY(), 'compendium', JSON_ARRAY()),
    'settings', JSON_OBJECT('volume', 0.8, 'lowMotion', false, 'language', 'zh-CN', 'resettable', true),
    'sandboxUnlocked', false,
    'progress', JSON_OBJECT()
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO classes (id, data) VALUES
  ('class-1', JSON_OBJECT(
    'id', 'class-1',
    'name', '一(1)班',
    'inviteCode', 'CA-CLASS-1',
    'teacherId', 'teacher-1',
    'studentIds', JSON_ARRAY('student-1'),
    'assignedCourseIds', JSON_ARRAY('course-1'),
    'hintLimit', 3
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO courses (id, data) VALUES
  ('course-1', JSON_OBJECT(
    'id', 'course-1',
    'name', '顺序指令入门',
    'description', '面向低年级的顺序指令课程，共 6 关。',
    'chapterIds', JSON_ARRAY('chapter-1')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO chapters (id, data) VALUES
  ('chapter-1', JSON_OBJECT(
    'id', 'chapter-1',
    'title', '第一章：顺序与方位',
    'order', 1,
    'levelIds', JSON_ARRAY('level-1')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO levels (id, data) VALUES
  ('level-1', JSON_OBJECT(
    'id', 'level-1',
    'name', '首关演示',
    'width', 3,
    'height', 3,
    'tiles', JSON_ARRAY(
      JSON_OBJECT('x', 0, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 1, 'walkable', true, 'collectible', 'gem'),
      JSON_OBJECT('x', 2, 'y', 2, 'walkable', true)
    ),
    'start', JSON_OBJECT('x', 0, 'y', 0, 'facing', 'east'),
    'goal', JSON_OBJECT('reach', JSON_OBJECT('x', 2, 'y', 1), 'collectibles', 1, 'stepLimit', 10),
    'bestSteps', 3,
    'hints', JSON_ARRAY('向前移动', '拾取宝石', '回到出口'),
    'chapterId', 'chapter-1',
    'comic', '小奇需要学会向前走到宝石旁。',
    'allowedBlocks', JSON_ARRAY('MOVE', 'TURN_LEFT', 'TURN_RIGHT'),
    'rewards', JSON_OBJECT('stars', 3, 'outfit', 'starter-boots')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO compendium_entries (id, data) VALUES
  ('artifact-1', JSON_OBJECT(
    'id', 'artifact-1',
    'chapterId', 'chapter-1',
    'name', '初始罗盘',
    'description', '帮助冒险者辨别方向的罗盘，通关第一章后获得。'
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO weekly_reports (id, data) VALUES
  ('student-1', JSON_OBJECT(
    'childId', 'student-1',
    'generatedAt', UNIX_TIMESTAMP() * 1000,
    'summary', '本周完成首关，并学习了前进指令。',
    'conceptsLearned', JSON_ARRAY('顺序执行', '方向判断'),
    'commonMistakes', JSON_ARRAY('忘记拾取宝石'),
    'recommendations', JSON_ARRAY('巩固前进与拾取操作')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO student_progress (id, data) VALUES
  ('student-1', JSON_ARRAY())
ON DUPLICATE KEY UPDATE data = VALUES(data);
