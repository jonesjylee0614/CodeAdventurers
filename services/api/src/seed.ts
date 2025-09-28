import * as Engine from '../../../packages/engine/src/index.ts';
type LevelDefinition = Engine.LevelDefinition;
import * as StoreModule from './store.ts';
type AdminProfile = StoreModule.AdminProfile;
type ClassDefinition = StoreModule.ClassDefinition;
type CompendiumEntry = StoreModule.CompendiumEntry;
type CourseDefinition = StoreModule.CourseDefinition;
type DataContext = StoreModule.DataContext;
type ParentProfile = StoreModule.ParentProfile;
type StudentProfile = StoreModule.StudentProfile;
type TeacherProfile = StoreModule.TeacherProfile;
type WeeklyReport = StoreModule.WeeklyReport;

export interface SeedOptions {
  now?: number;
  force?: boolean;
}

export async function seedData(store: DataContext, options: SeedOptions = {}): Promise<void> {
  const now = options.now ?? Date.now();
  if (!options.force) {
    const existing = await store.users.list();
    if (existing.length > 0) {
      return;
    }
  }

  const teacher: TeacherProfile = {
    id: 'teacher-1',
    name: '李老师',
    role: 'teacher',
    managedClassIds: ['class-1'],
    courseIds: ['course-1']
  };

  const parent: ParentProfile = {
    id: 'parent-1',
    name: '陈妈妈',
    role: 'parent' as const,
    childIds: ['student-1'],
    settings: {
      reminderTime: '20:00',
      weeklyReportDay: '周日',
      notifyChannels: ['app', 'email']
    }
  };

  const admin: AdminProfile = {
    id: 'admin-1',
    name: '系统管理员',
    role: 'admin'
  };

  const student: StudentProfile = {
    id: 'student-1',
    name: '小奇',
    role: 'student',
    classId: 'class-1',
    inviteCode: 'CA-CLASS-1',
    avatar: {
      equipped: 'starter-cape',
      unlocked: ['starter-cape']
    },
    achievements: {
      badges: [],
      compendium: []
    },
    settings: {
      volume: 0.8,
      lowMotion: false,
      language: 'zh-CN',
      resettable: true
    },
    sandboxUnlocked: false,
    progress: {}
  };

  const classDef: ClassDefinition = {
    id: 'class-1',
    name: '一(1)班',
    inviteCode: 'CA-CLASS-1',
    teacherId: teacher.id,
    studentIds: [student.id],
    assignedCourseIds: ['course-1'],
    hintLimit: 3
  };

  const level: LevelDefinition & {
    chapterId: string;
    comic: string;
    allowedBlocks: string[];
    rewards: { stars: number; outfit: string | null };
  } = {
    id: 'level-1',
    name: '首关演示',
    width: 3,
    height: 3,
    tiles: [
      { x: 0, y: 0, walkable: true },
      { x: 1, y: 0, walkable: true },
      { x: 2, y: 0, walkable: true },
      { x: 2, y: 1, walkable: true, collectible: 'gem' },
      { x: 2, y: 2, walkable: true }
    ],
    start: { x: 0, y: 0, facing: 'east' },
    goal: { reach: { x: 2, y: 1 }, collectibles: 1, stepLimit: 10 },
    bestSteps: 3,
    hints: ['向前移动', '拾取宝石', '回到出口'],
    chapterId: 'chapter-1',
    comic: '小奇需要学会向前走到宝石旁。',
    allowedBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT'],
    rewards: { stars: 3, outfit: 'starter-boots' }
  };

  const chapter = {
    id: 'chapter-1',
    title: '第一章：顺序与方位',
    order: 1,
    levelIds: [level.id]
  };

  const course: CourseDefinition = {
    id: 'course-1',
    name: '顺序指令入门',
    description: '面向低年级的顺序指令课程，共 6 关。',
    chapterIds: [chapter.id]
  };

  const compendium: CompendiumEntry = {
    id: 'artifact-1',
    chapterId: chapter.id,
    name: '初始罗盘',
    description: '帮助冒险者辨别方向的罗盘，通关第一章后获得。'
  };

  const report: WeeklyReport = {
    childId: student.id,
    generatedAt: now,
    summary: '本周完成首关，并学习了前进指令。',
    conceptsLearned: ['顺序执行', '方向判断'],
    commonMistakes: ['忘记拾取宝石'],
    recommendations: ['巩固前进与拾取操作']
  };

  await Promise.all([
    store.users.set(student.id, student),
    store.users.set(teacher.id, teacher),
    store.users.set(parent.id, parent),
    store.users.set(admin.id, admin),
    store.classes.set(classDef.id, classDef),
    store.levels.set(level.id, level),
    store.chapters.set(chapter.id, chapter),
    store.courses.set(course.id, course),
    store.compendium.set(compendium.id, compendium),
    store.weeklyReports.set(report.childId, report),
    store.progress.set(student.id, [])
  ]);
}

export async function ensureSandboxUnlock(store: DataContext, studentId: string): Promise<void> {
  const student = await store.users.get(studentId);
  if (!student || student.role !== 'student') {
    return;
  }
  const classDef = await store.classes.get(student.classId);
  if (!classDef) {
    return;
  }
  const chapters = await Promise.all(
    classDef.assignedCourseIds.map(async (courseId) => {
      const course = await store.courses.get(courseId);
      if (!course) {
        return [] as string[];
      }
      const chapterEntities = await Promise.all(course.chapterIds.map((chapterId) => store.chapters.get(chapterId)));
      return chapterEntities
        .filter((chapter): chapter is NonNullable<typeof chapter> => Boolean(chapter))
        .flatMap((chapter) => chapter.levelIds);
    })
  );
  const allLevels = chapters.flat();
  const completedLevels = Object.values(student.progress)
    .filter((p) => p.stars > 0)
    .map((p) => p.levelId);
  if (!student.sandboxUnlocked && allLevels.length > 0 && allLevels.every((id) => completedLevels.includes(id))) {
    student.sandboxUnlocked = true;
    await store.users.set(student.id, student);
  }
}
