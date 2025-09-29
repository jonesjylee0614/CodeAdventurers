-- Initial dataset aligned with backend domain defaults
USE code_adventurers;

INSERT INTO users (id, data) VALUES
  ('teacher-1', JSON_OBJECT(
    'id', 'teacher-1',
    'name', '李老师',
    'role', 'teacher',
    'managedClassIds', JSON_ARRAY('class-1', 'class-2'),
    'courseIds', JSON_ARRAY('course-1')
  )),
  ('teacher-2', JSON_OBJECT(
    'id', 'teacher-2',
    'name', '王老师',
    'role', 'teacher',
    'managedClassIds', JSON_ARRAY('class-3'),
    'courseIds', JSON_ARRAY('course-1', 'course-2')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO users (id, data) VALUES
  ('parent-1', JSON_OBJECT(
    'id', 'parent-1',
    'name', '陈妈妈',
    'role', 'parent',
    'childIds', JSON_ARRAY('student-1')
  )),
  ('parent-2', JSON_OBJECT(
    'id', 'parent-2',
    'name', '刘爸爸',
    'role', 'parent',
    'childIds', JSON_ARRAY('student-2')
  )),
  ('parent-3', JSON_OBJECT(
    'id', 'parent-3',
    'name', '赵妈妈',
    'role', 'parent',
    'childIds', JSON_ARRAY('student-3', 'student-4')
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
  )),
  ('student-2', JSON_OBJECT(
    'id', 'student-2',
    'name', '小睿',
    'role', 'student',
    'classId', 'class-1',
    'inviteCode', 'CA-CLASS-1',
    'avatar', JSON_OBJECT('equipped', 'starter-helmet', 'unlocked', JSON_ARRAY('starter-cape', 'starter-helmet')),
    'achievements', JSON_OBJECT('badges', JSON_ARRAY('first-gem'), 'compendium', JSON_ARRAY('artifact-1')),
    'settings', JSON_OBJECT('volume', 0.6, 'lowMotion', true, 'language', 'zh-CN', 'resettable', true),
    'sandboxUnlocked', true,
    'progress', JSON_OBJECT(
      'course-1', JSON_OBJECT('completedLevels', JSON_ARRAY('level-1', 'level-2'), 'stars', 5)
    )
  )),
  ('student-3', JSON_OBJECT(
    'id', 'student-3',
    'name', '小敏',
    'role', 'student',
    'classId', 'class-2',
    'inviteCode', 'CA-CLASS-2',
    'avatar', JSON_OBJECT('equipped', 'starter-cape', 'unlocked', JSON_ARRAY('starter-cape', 'starter-boots')),
    'achievements', JSON_OBJECT('badges', JSON_ARRAY('logic-starter'), 'compendium', JSON_ARRAY()),
    'settings', JSON_OBJECT('volume', 1.0, 'lowMotion', false, 'language', 'zh-CN', 'resettable', true),
    'sandboxUnlocked', false,
    'progress', JSON_OBJECT(
      'course-1', JSON_OBJECT('completedLevels', JSON_ARRAY('level-1'), 'stars', 3),
      'course-2', JSON_OBJECT('completedLevels', JSON_ARRAY('level-4'), 'stars', 3)
    )
  )),
  ('student-4', JSON_OBJECT(
    'id', 'student-4',
    'name', '小豪',
    'role', 'student',
    'classId', 'class-3',
    'inviteCode', 'CA-CLASS-3',
    'avatar', JSON_OBJECT('equipped', 'starter-boots', 'unlocked', JSON_ARRAY('starter-boots')),
    'achievements', JSON_OBJECT('badges', JSON_ARRAY('first-gem', 'loop-master'), 'compendium', JSON_ARRAY('artifact-2')),
    'settings', JSON_OBJECT('volume', 0.7, 'lowMotion', false, 'language', 'zh-CN', 'resettable', true),
    'sandboxUnlocked', true,
    'progress', JSON_OBJECT(
      'course-2', JSON_OBJECT('completedLevels', JSON_ARRAY('level-4', 'level-5'), 'stars', 6)
    )
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO classes (id, data) VALUES
  ('class-1', JSON_OBJECT(
    'id', 'class-1',
    'name', '一(1)班',
    'inviteCode', 'CA-CLASS-1',
    'teacherId', 'teacher-1',
    'studentIds', JSON_ARRAY('student-1', 'student-2'),
    'assignedCourseIds', JSON_ARRAY('course-1'),
    'hintLimit', 3
  )),
  ('class-2', JSON_OBJECT(
    'id', 'class-2',
    'name', '一(2)班',
    'inviteCode', 'CA-CLASS-2',
    'teacherId', 'teacher-1',
    'studentIds', JSON_ARRAY('student-3'),
    'assignedCourseIds', JSON_ARRAY('course-1', 'course-2'),
    'hintLimit', 5
  )),
  ('class-3', JSON_OBJECT(
    'id', 'class-3',
    'name', '二(1)班',
    'inviteCode', 'CA-CLASS-3',
    'teacherId', 'teacher-2',
    'studentIds', JSON_ARRAY('student-4'),
    'assignedCourseIds', JSON_ARRAY('course-2'),
    'hintLimit', 4
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO courses (id, data) VALUES
  ('course-1', JSON_OBJECT(
    'id', 'course-1',
    'name', '顺序指令入门',
    'description', '面向低年级的顺序与条件指令课程，共 3 章。',
    'chapterIds', JSON_ARRAY('chapter-1', 'chapter-2')
  )),
  ('course-2', JSON_OBJECT(
    'id', 'course-2',
    'name', '循环与调试进阶',
    'description', '通过循环与调试巩固顺序思维，共 2 章。',
    'chapterIds', JSON_ARRAY('chapter-3', 'chapter-4')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO chapters (id, data) VALUES
  ('chapter-1', JSON_OBJECT(
    'id', 'chapter-1',
    'title', '第一章：顺序与方位',
    'order', 1,
    'levelIds', JSON_ARRAY('level-1')
  )),
  ('chapter-2', JSON_OBJECT(
    'id', 'chapter-2',
    'title', '第二章：条件与选择',
    'order', 2,
    'levelIds', JSON_ARRAY('level-2', 'level-3')
  )),
  ('chapter-3', JSON_OBJECT(
    'id', 'chapter-3',
    'title', '第一章：循环初探',
    'order', 1,
    'levelIds', JSON_ARRAY('level-4', 'level-5')
  )),
  ('chapter-4', JSON_OBJECT(
    'id', 'chapter-4',
    'title', '第二章：调试技巧',
    'order', 2,
    'levelIds', JSON_ARRAY('level-6')
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
  )),
  ('level-2', JSON_OBJECT(
    'id', 'level-2',
    'name', '岔路口的选择',
    'width', 4,
    'height', 4,
    'tiles', JSON_ARRAY(
      JSON_OBJECT('x', 0, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 1, 'walkable', true, 'collectible', 'gem'),
      JSON_OBJECT('x', 2, 'y', 2, 'walkable', true, 'trigger', JSON_OBJECT('type', 'switch', 'id', 'S1')),
      JSON_OBJECT('x', 3, 'y', 2, 'walkable', true)
    ),
    'start', JSON_OBJECT('x', 0, 'y', 0, 'facing', 'east'),
    'goal', JSON_OBJECT('reach', JSON_OBJECT('x', 3, 'y', 2), 'collectibles', 1, 'stepLimit', 18),
    'bestSteps', 8,
    'hints', JSON_ARRAY('观察两条路径', '使用条件判断是否需要转弯', '拾取宝石后再前进'),
    'chapterId', 'chapter-2',
    'comic', '小奇来到岔路，需要判断正确的方向。',
    'allowedBlocks', JSON_ARRAY('MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_PATH_AHEAD'),
    'rewards', JSON_OBJECT('stars', 3, 'outfit', 'decision-cloak')
  )),
  ('level-3', JSON_OBJECT(
    'id', 'level-3',
    'name', '守卫的巡逻',
    'width', 5,
    'height', 5,
    'tiles', JSON_ARRAY(
      JSON_OBJECT('x', 0, 'y', 2, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 2, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 2, 'walkable', true, 'collectible', 'gem'),
      JSON_OBJECT('x', 3, 'y', 2, 'walkable', true),
      JSON_OBJECT('x', 4, 'y', 2, 'walkable', true),
      JSON_OBJECT('x', 4, 'y', 3, 'walkable', true)
    ),
    'start', JSON_OBJECT('x', 0, 'y', 2, 'facing', 'east'),
    'goal', JSON_OBJECT('reach', JSON_OBJECT('x', 4, 'y', 3), 'collectibles', 1, 'stepLimit', 22),
    'bestSteps', 10,
    'hints', JSON_ARRAY('守卫会定时出现', '利用条件语句等待时机', '注意步数限制'),
    'chapterId', 'chapter-2',
    'comic', '守卫巡逻的时间点需要精准掌握。',
    'allowedBlocks', JSON_ARRAY('MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_ENEMY_AHEAD', 'WAIT'),
    'rewards', JSON_OBJECT('stars', 3, 'outfit', 'stealth-hood')
  )),
  ('level-4', JSON_OBJECT(
    'id', 'level-4',
    'name', '重复的桥段',
    'width', 4,
    'height', 3,
    'tiles', JSON_ARRAY(
      JSON_OBJECT('x', 0, 'y', 1, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 1, 'walkable', true, 'collectible', 'gem'),
      JSON_OBJECT('x', 2, 'y', 1, 'walkable', true, 'collectible', 'gem'),
      JSON_OBJECT('x', 3, 'y', 1, 'walkable', true, 'collectible', 'gem')
    ),
    'start', JSON_OBJECT('x', 0, 'y', 1, 'facing', 'east'),
    'goal', JSON_OBJECT('reach', JSON_OBJECT('x', 3, 'y', 1), 'collectibles', 3, 'stepLimit', 14),
    'bestSteps', 6,
    'hints', JSON_ARRAY('重复的路径可以用循环解决', '确保循环次数正确', '别忘记拾取所有宝石'),
    'chapterId', 'chapter-3',
    'comic', '桥上布满宝石，重复指令显得乏味。',
    'allowedBlocks', JSON_ARRAY('MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'LOOP_TIMES'),
    'rewards', JSON_OBJECT('stars', 3, 'outfit', 'loop-gloves')
  )),
  ('level-5', JSON_OBJECT(
    'id', 'level-5',
    'name', '嵌套迷宫',
    'width', 5,
    'height', 4,
    'tiles', JSON_ARRAY(
      JSON_OBJECT('x', 0, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 0, 'walkable', true, 'collectible', 'gem'),
      JSON_OBJECT('x', 2, 'y', 1, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 2, 'walkable', true),
      JSON_OBJECT('x', 3, 'y', 2, 'walkable', true),
      JSON_OBJECT('x', 4, 'y', 2, 'walkable', true)
    ),
    'start', JSON_OBJECT('x', 0, 'y', 0, 'facing', 'east'),
    'goal', JSON_OBJECT('reach', JSON_OBJECT('x', 4, 'y', 2), 'collectibles', 1, 'stepLimit', 28),
    'bestSteps', 12,
    'hints', JSON_ARRAY('考虑循环嵌套', '先完成内圈', '利用调试观察路径'),
    'chapterId', 'chapter-3',
    'comic', '复杂的迷宫需要组合循环。',
    'allowedBlocks', JSON_ARRAY('MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'LOOP_TIMES', 'LOOP_WHILE_PATH'),
    'rewards', JSON_OBJECT('stars', 3, 'outfit', 'maze-cloak')
  )),
  ('level-6', JSON_OBJECT(
    'id', 'level-6',
    'name', '调试实验室',
    'width', 4,
    'height', 4,
    'tiles', JSON_ARRAY(
      JSON_OBJECT('x', 0, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 0, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 1, 'walkable', true, 'collectible', 'gem'),
      JSON_OBJECT('x', 1, 'y', 2, 'walkable', true),
      JSON_OBJECT('x', 1, 'y', 3, 'walkable', true),
      JSON_OBJECT('x', 2, 'y', 3, 'walkable', true),
      JSON_OBJECT('x', 3, 'y', 3, 'walkable', true)
    ),
    'start', JSON_OBJECT('x', 0, 'y', 0, 'facing', 'east'),
    'goal', JSON_OBJECT('reach', JSON_OBJECT('x', 3, 'y', 3), 'collectibles', 1, 'stepLimit', 24),
    'bestSteps', 11,
    'hints', JSON_ARRAY('先写出可能出错的解法', '使用调试逐步执行', '修正循环条件'),
    'chapterId', 'chapter-4',
    'comic', '实验室提供调试终端，逐步排查问题。',
    'allowedBlocks', JSON_ARRAY('MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'LOOP_TIMES', 'BREAK_LOOP', 'DEBUG_PRINT'),
    'rewards', JSON_OBJECT('stars', 3, 'outfit', 'debug-visor')
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO compendium_entries (id, data) VALUES
  ('artifact-1', JSON_OBJECT(
    'id', 'artifact-1',
    'chapterId', 'chapter-1',
    'name', '初始罗盘',
    'description', '帮助冒险者辨别方向的罗盘，通关第一章后获得。'
  )),
  ('artifact-2', JSON_OBJECT(
    'id', 'artifact-2',
    'chapterId', 'chapter-3',
    'name', '循环权杖',
    'description', '掌握循环后获得的权杖，可缩短重复操作的时间。'
  )),
  ('artifact-3', JSON_OBJECT(
    'id', 'artifact-3',
    'chapterId', 'chapter-4',
    'name', '调试晶体',
    'description', '记录程序每一步状态的晶体，帮助发现错误。'
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
  )),
  ('student-2', JSON_OBJECT(
    'childId', 'student-2',
    'generatedAt', UNIX_TIMESTAMP() * 1000,
    'summary', '掌握了条件判断，能独立选择正确路径。',
    'conceptsLearned', JSON_ARRAY('条件判断', '简单循环'),
    'commonMistakes', JSON_ARRAY('循环次数多加一次'),
    'recommendations', JSON_ARRAY('继续练习条件语句的嵌套')
  )),
  ('student-3', JSON_OBJECT(
    'childId', 'student-3',
    'generatedAt', UNIX_TIMESTAMP() * 1000,
    'summary', '尝试了进阶课程，对循环有初步理解。',
    'conceptsLearned', JSON_ARRAY('顺序执行', '循环基础'),
    'commonMistakes', JSON_ARRAY('忘记重置变量'),
    'recommendations', JSON_ARRAY('使用调试模式观察变量变化')
  )),
  ('student-4', JSON_OBJECT(
    'childId', 'student-4',
    'generatedAt', UNIX_TIMESTAMP() * 1000,
    'summary', '完成了循环进阶章节，并成功调试了错误。',
    'conceptsLearned', JSON_ARRAY('循环嵌套', '调试技巧'),
    'commonMistakes', JSON_ARRAY('初次编写时遗漏收集宝石'),
    'recommendations', JSON_ARRAY('挑战自定义关卡，巩固调试思维'))
  )
ON DUPLICATE KEY UPDATE data = VALUES(data);

INSERT INTO student_progress (id, data) VALUES
  ('student-1', JSON_ARRAY(
    JSON_OBJECT('levelId', 'level-1', 'status', 'completed', 'stars', 3, 'updatedAt', UNIX_TIMESTAMP() * 1000)
  )),
  ('student-2', JSON_ARRAY(
    JSON_OBJECT('levelId', 'level-1', 'status', 'completed', 'stars', 3, 'updatedAt', UNIX_TIMESTAMP() * 1000),
    JSON_OBJECT('levelId', 'level-2', 'status', 'completed', 'stars', 2, 'updatedAt', UNIX_TIMESTAMP() * 1000)
  )),
  ('student-3', JSON_ARRAY(
    JSON_OBJECT('levelId', 'level-1', 'status', 'completed', 'stars', 3, 'updatedAt', UNIX_TIMESTAMP() * 1000),
    JSON_OBJECT('levelId', 'level-4', 'status', 'in-progress', 'stars', 0, 'updatedAt', UNIX_TIMESTAMP() * 1000)
  )),
  ('student-4', JSON_ARRAY(
    JSON_OBJECT('levelId', 'level-4', 'status', 'completed', 'stars', 3, 'updatedAt', UNIX_TIMESTAMP() * 1000),
    JSON_OBJECT('levelId', 'level-5', 'status', 'completed', 'stars', 3, 'updatedAt', UNIX_TIMESTAMP() * 1000),
    JSON_OBJECT('levelId', 'level-6', 'status', 'in-review', 'stars', 0, 'updatedAt', UNIX_TIMESTAMP() * 1000)
  ))
ON DUPLICATE KEY UPDATE data = VALUES(data);
