import express, { Request, Response, NextFunction } from 'express';
import * as Engine from '../../../packages/engine/src/index.ts';
const LevelSimulator = Engine.LevelSimulator;
const computeHint = Engine.computeHint;
type Instruction = Engine.Instruction;
type HintPayload = Engine.HintPayload;
import { TelemetryBuffer } from './telemetry.ts';
import { ensureSandboxUnlock, seedData } from './seed.ts';
import {
  AdminProfile,
  ClassDefinition,
  CourseDefinition,
  DataContext,
  ExportRecord,
  ParentProfile,
  Role,
  SandboxProject,
  StudentProfile,
  StudentProgressRecord,
  TeacherProfile,
  UserProfile,
  WeeklyReport,
  WorkSubmission,
  createDataContext
} from './store.ts';

interface RequestWithUser extends Request {
  user?: UserProfile;
}

function requireUser(req: RequestWithUser, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: '未登录' });
    return;
  }
  next();
}

function requireRole<T extends Role>(role: T) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ message: '无权限' });
      return;
    }
    next();
  };
}

export interface ServerOptions {
  context?: DataContext;
  mode?: 'memory' | 'mysql';
  telemetry?: TelemetryBuffer;
}

export interface ServerInstance {
  app: express.Express;
  context: DataContext;
  telemetry: TelemetryBuffer;
}

export async function createServer(options: ServerOptions = {}): Promise<ServerInstance> {
  const context = options.context ?? (await createDataContext({ mode: options.mode }));
  const telemetry = options.telemetry ?? new TelemetryBuffer();
  await seedData(context);

  const app = express();
  app.use(express.json());

  // 首页路由 - 导航和功能介绍
  app.get('/', (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeAdventurers - 编程冒险家</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Microsoft YaHei', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .nav-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-decoration: none;
            color: inherit;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        .card-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        .card h3 {
            color: #4a5568;
            margin-bottom: 10px;
            font-size: 1.5em;
        }
        .card p {
            color: #718096;
            line-height: 1.5;
        }
        .features {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 30px;
            margin-top: 30px;
            color: white;
        }
        .features h2 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .feature-item {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
        }
        .feature-item h4 {
            margin-bottom: 10px;
            font-size: 1.3em;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: rgba(255,255,255,0.8);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CodeAdventurers</h1>
            <p>欢迎来到编程冒险家平台！让编程学习变得有趣而简单</p>
        </div>

        <div class="nav-cards">
            <a href="/student" class="card">
                <div class="card-icon">🎓</div>
                <h3>学生端</h3>
                <p>开始你的编程冒险之旅！通过游戏化的方式学习编程，解锁新技能，收集成就徽章。</p>
            </a>

            <a href="/teacher" class="card">
                <div class="card-icon">👨‍🏫</div>
                <h3>教师端</h3>
                <p>管理课程内容，创建编程关卡，追踪学生进度，查看学习分析报告。</p>
            </a>

            <a href="/parent" class="card">
                <div class="card-icon">👨‍👩‍👧‍👦</div>
                <h3>家长端</h3>
                <p>查看孩子的学习进度，获取周报，了解孩子在编程学习中的表现。</p>
            </a>

            <a href="/admin" class="card">
                <div class="card-icon">⚙️</div>
                <h3>管理端</h3>
                <p>系统管理，用户管理，数据分析，平台配置和维护。</p>
            </a>
        </div>

        <div class="features">
            <h2>✨ 平台特色功能</h2>
            <div class="feature-grid">
                <div class="feature-item">
                    <h4>🎮 游戏化学习</h4>
                    <p>通过闯关模式学习编程，每个关卡都有独特的挑战和奖励，让学习过程充满乐趣。</p>
                </div>
                <div class="feature-item">
                    <h4>🏆 成就系统</h4>
                    <p>解锁徽章、收集装备、完善图鉴，激发学习动力，记录成长历程。</p>
                </div>
                <div class="feature-item">
                    <h4>🛠️ 沙盒模式</h4>
                    <p>自由创作编程作品，分享给同学，在实践中巩固所学知识。</p>
                </div>
                <div class="feature-item">
                    <h4>📊 学习分析</h4>
                    <p>详细的学习数据分析，帮助老师和家长了解学习情况，制定个性化学习计划。</p>
                </div>
                <div class="feature-item">
                    <h4>💡 智能提示</h4>
                    <p>当遇到困难时，系统会提供恰当的提示，引导学生思考而不是直接给出答案。</p>
                </div>
                <div class="feature-item">
                    <h4>🌟 作品展示</h4>
                    <p>学生可以发布自己的编程作品，获得同学和老师的点赞评论，建立学习社区。</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>© 2025 CodeAdventurers - 让每个孩子都能享受编程的乐趣</p>
            <p>API 文档: <a href="/api" style="color: #90cdf4;">/api</a></p>
        </div>
    </div>
</body>
</html>
    `);
  });

  // 各端点的占位页面
  app.get('/student', (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>学生端 - CodeAdventurers</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .container { background: white; border-radius: 15px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; }
        h1 { color: #4a5568; margin-bottom: 20px; }
        p { color: #718096; line-height: 1.6; margin-bottom: 20px; }
        .back-link { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; transition: background 0.3s; }
        .back-link:hover { background: #5a67d8; }
        .status { background: #fed7d7; color: #c53030; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 学生端</h1>
        <div class="status">开发中 - Coming Soon</div>
        <p>这里将是学生的编程学习界面，包含：</p>
        <ul style="text-align: left; color: #718096;">
            <li>编程关卡挑战</li>
            <li>成就系统</li>
            <li>个人资料管理</li>
            <li>沙盒创作工具</li>
            <li>作品分享社区</li>
        </ul>
        <a href="/" class="back-link">← 返回首页</a>
    </div>
</body>
</html>
    `);
  });

  app.get('/teacher', (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>教师端 - CodeAdventurers</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .container { background: white; border-radius: 15px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; }
        h1 { color: #4a5568; margin-bottom: 20px; }
        p { color: #718096; line-height: 1.6; margin-bottom: 20px; }
        .back-link { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; transition: background 0.3s; }
        .back-link:hover { background: #5a67d8; }
        .status { background: #fed7d7; color: #c53030; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>👨‍🏫 教师端</h1>
        <div class="status">开发中 - Coming Soon</div>
        <p>这里将是教师的管理界面，包含：</p>
        <ul style="text-align: left; color: #718096;">
            <li>课程内容管理</li>
            <li>关卡编辑器</li>
            <li>学生进度追踪</li>
            <li>学习数据分析</li>
            <li>作品审核系统</li>
        </ul>
        <a href="/" class="back-link">← 返回首页</a>
    </div>
</body>
</html>
    `);
  });

  app.get('/parent', (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>家长端 - CodeAdventurers</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .container { background: white; border-radius: 15px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; }
        h1 { color: #4a5568; margin-bottom: 20px; }
        p { color: #718096; line-height: 1.6; margin-bottom: 20px; }
        .back-link { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; transition: background 0.3s; }
        .back-link:hover { background: #5a67d8; }
        .status { background: #fed7d7; color: #c53030; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>👨‍👩‍👧‍👦 家长端</h1>
        <div class="status">开发中 - Coming Soon</div>
        <p>这里将是家长的监督界面，包含：</p>
        <ul style="text-align: left; color: #718096;">
            <li>孩子学习进度查看</li>
            <li>周报和月报</li>
            <li>学习时间统计</li>
            <li>成就展示</li>
            <li>学习建议</li>
        </ul>
        <a href="/" class="back-link">← 返回首页</a>
    </div>
</body>
</html>
    `);
  });

  app.get('/admin', (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理端 - CodeAdventurers</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .container { background: white; border-radius: 15px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; }
        h1 { color: #4a5568; margin-bottom: 20px; }
        p { color: #718096; line-height: 1.6; margin-bottom: 20px; }
        .back-link { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; transition: background 0.3s; }
        .back-link:hover { background: #5a67d8; }
        .status { background: #fed7d7; color: #c53030; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ 管理端</h1>
        <div class="status">开发中 - Coming Soon</div>
        <p>这里将是系统管理界面，包含：</p>
        <ul style="text-align: left; color: #718096;">
            <li>用户管理</li>
            <li>系统配置</li>
            <li>数据统计</li>
            <li>资源管理</li>
            <li>平台监控</li>
        </ul>
        <a href="/" class="back-link">← 返回首页</a>
    </div>
</body>
</html>
    `);
  });

  app.use(async (req: RequestWithUser, _res, next) => {
    try {
      const userId = req.header('x-user-id');
      if (userId) {
        const user = await context.users.get(userId);
        if (user) {
          req.user = user;
        }
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  app.post('/api/system/reset', async (_req, res, next) => {
    try {
      await context.reset();
      await seedData(context, { force: true });
      telemetry.flush();
      res.status(204).send();
    } catch (error) {
      next(error as Error);
    }
  });

  app.post('/api/auth/guest', async (req, res, next) => {
    try {
      const name = req.body?.name ?? '游客';
      const id = context.createId('guest');
      const guest: StudentProfile = {
        id,
        name,
        role: 'student',
        classId: 'guest-lobby',
        avatar: { equipped: 'starter-cape', unlocked: ['starter-cape'] },
        achievements: { badges: [], compendium: [] },
        settings: { volume: 0.6, lowMotion: false, language: 'zh-CN', resettable: true },
        sandboxUnlocked: false,
        progress: {}
      };
      await context.users.set(id, guest);
      const existing = await context.classes.get('guest-lobby');
      const lobby: ClassDefinition =
        existing ?? {
          id: 'guest-lobby',
          name: '体验大厅',
          inviteCode: 'GUEST',
          teacherId: 'teacher-1',
          studentIds: [],
          assignedCourseIds: ['course-1'],
          hintLimit: 3
        };
      lobby.studentIds = Array.from(new Set([...lobby.studentIds, id]));
      await context.classes.set(lobby.id, lobby);
      res.status(201).json({ userId: id, name, role: 'student' });
    } catch (error) {
      next(error as Error);
    }
  });

  app.post('/api/auth/class', async (req, res, next) => {
    try {
      const { inviteCode, name } = req.body ?? {};
      if (!inviteCode) {
        res.status(400).json({ message: '缺少邀请码' });
        return;
      }
      const classes = await context.classes.list();
      const classEntry = classes.find((item) => item.inviteCode === inviteCode);
      if (!classEntry) {
        res.status(404).json({ message: '班级不存在' });
        return;
      }
      const id = context.createId('student');
      const profile: StudentProfile = {
        id,
        name: name ?? '新同学',
        role: 'student',
        classId: classEntry.id,
        avatar: { equipped: 'starter-cape', unlocked: ['starter-cape'] },
        achievements: { badges: [], compendium: [] },
        settings: { volume: 0.8, lowMotion: false, language: 'zh-CN', resettable: true },
        sandboxUnlocked: false,
        progress: {}
      };
      classEntry.studentIds.push(id);
      await Promise.all([
        context.users.set(id, profile),
        context.classes.set(classEntry.id, classEntry)
      ]);
      res.status(201).json({ userId: id, classId: classEntry.id });
    } catch (error) {
      next(error as Error);
    }
  });

  // 学生端
  app.get('/api/student/profile', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const classInfo = await context.classes.get(student.classId);
    res.json({
      id: student.id,
      name: student.name,
      class: classInfo?.name ?? '体验班级',
      settings: student.settings,
      avatar: student.avatar,
      sandboxUnlocked: student.sandboxUnlocked,
      achievements: student.achievements
    });
  });

  app.get('/api/student/map', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const classInfo = await context.classes.get(student.classId);
    if (!classInfo) {
      res.status(404).json({ message: '未找到班级' });
      return;
    }
    const chapters: Array<{ id: string; title: string; levels: Array<{ id: string; name: string; status: string; stars: number; bestDifference: number | null }> }> = [];
    for (const courseId of classInfo.assignedCourseIds) {
      const course = await context.courses.get(courseId);
      if (!course) {
        continue;
      }
      for (const chapterId of course.chapterIds) {
        const chapter = await context.chapters.get(chapterId);
        if (!chapter) {
          continue;
        }
        const levels = [] as Array<{ id: string; name: string; status: string; stars: number; bestDifference: number | null }>;
        for (const levelId of chapter.levelIds) {
          const level = await context.levels.get(levelId);
          if (!level) {
            continue;
          }
          const progress = student.progress[levelId];
          const status = progress ? 'completed' : 'locked';
          levels.push({
            id: levelId,
            name: level.name,
            status,
            stars: progress?.stars ?? 0,
            bestDifference: progress?.bestDifference ?? null
          });
        }
        chapters.push({ id: chapter.id, title: chapter.title, levels });
      }
    }
    chapters.sort((a, b) => a.id.localeCompare(b.id));
    res.json({ chapters });
  });

  app.get('/api/student/levels/:levelId/prep', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const level = await context.levels.get(req.params.levelId);
    if (!level) {
      res.status(404).json({ message: '关卡不存在' });
      return;
    }
    res.json({
      levelId: level.id,
      victoryCondition: level.goal,
      allowedBlocks: level.allowedBlocks,
      comic: level.comic,
      rewards: level.rewards
    });
  });

  app.post('/api/student/levels/:levelId/run', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const level = await context.levels.get(req.params.levelId);
    if (!level) {
      res.status(404).json({ message: '关卡不存在' });
      return;
    }
    const program = req.body?.program as Instruction[];
    if (!Array.isArray(program)) {
      res.status(400).json({ message: '程序需为指令数组' });
      return;
    }
    const simulator = new LevelSimulator(level);
    const result = simulator.run(program);
    telemetry.record({ type: 'run', payload: { levelId: level.id, studentId: req.user!.id, log: result.log }, timestamp: Date.now() });
    res.json(result);
  });

  app.post('/api/student/levels/:levelId/complete', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const level = await context.levels.get(req.params.levelId);
    if (!level) {
      res.status(404).json({ message: '关卡不存在' });
      return;
    }
    const { stars, steps, hints, duration, bestDifference, replayLog } = req.body ?? {};
    if (typeof stars !== 'number' || typeof steps !== 'number') {
      res.status(400).json({ message: '缺少结算数据' });
      return;
    }
    const record: StudentProgressRecord = {
      levelId: level.id,
      stars,
      steps,
      hints: typeof hints === 'number' ? hints : 0,
      duration: typeof duration === 'number' ? duration : 0,
      bestDifference: typeof bestDifference === 'number' ? bestDifference : Math.max(0, steps - level.bestSteps),
      completedAt: Date.now(),
      replayLog: Array.isArray(replayLog) ? replayLog : []
    };

    const progress = await context.progress.get(student.id);
    const list = progress ?? [];
    const existingIndex = list.findIndex((item) => item.levelId === level.id);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }

    student.progress[level.id] = record;
    if (!student.avatar.unlocked.includes(level.rewards.outfit ?? '')) {
      if (level.rewards.outfit) {
        student.avatar.unlocked.push(level.rewards.outfit);
      }
    }
    await Promise.all([
      context.users.set(student.id, student),
      context.progress.set(student.id, list)
    ]);
    await ensureSandboxUnlock(context, student.id);
    telemetry.record({ type: 'complete', payload: { levelId: level.id, studentId: student.id, stars }, timestamp: Date.now() });
    res.status(201).json(record);
  });

  app.get('/api/student/avatar', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    res.json(student.avatar);
  });

  app.put('/api/student/avatar', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const { equipped } = req.body ?? {};
    if (typeof equipped !== 'string' || !student.avatar.unlocked.includes(equipped)) {
      res.status(400).json({ message: '无效的装扮' });
      return;
    }
    student.avatar.equipped = equipped;
    await context.users.set(student.id, student);
    res.json(student.avatar);
  });

  app.post('/api/student/compendium/unlock', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const { entryId } = req.body ?? {};
    if (!entryId) {
      res.status(400).json({ message: '缺少图鉴 ID' });
      return;
    }
    if (!student.achievements.compendium.includes(entryId)) {
      student.achievements.compendium.push(entryId);
      await context.users.set(student.id, student);
    }
    res.json({ unlocked: student.achievements.compendium });
  });

  app.get('/api/student/settings', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    res.json(student.settings);
  });

  app.put('/api/student/settings', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    student.settings = { ...student.settings, ...req.body };
    await context.users.set(student.id, student);
    res.json(student.settings);
  });

  app.post('/api/student/settings/reset-progress', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    student.progress = {};
    student.sandboxUnlocked = false;
    await Promise.all([
      context.users.set(student.id, student),
      context.progress.set(student.id, [])
    ]);
    res.status(204).send();
  });

  app.get('/api/student/sandbox', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const projects = (await context.sandbox.list()).filter((item) => item.ownerId === student.id);
    res.json({ sandboxUnlocked: student.sandboxUnlocked, projects });
  });

  app.post('/api/student/sandbox', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const now = Date.now();
    const project: SandboxProject = {
      id: context.createId('project'),
      ownerId: student.id,
      title: req.body?.title ?? '未命名作品',
      data: req.body?.data ?? {},
      status: 'draft',
      visibility: 'private',
      createdAt: now,
      updatedAt: now
    };
    await context.sandbox.set(project.id, project);
    res.status(201).json(project);
  });

  app.patch('/api/student/sandbox/:id', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const project = await context.sandbox.get(req.params.id);
    if (!project || project.ownerId !== student.id) {
      res.status(404).json({ message: '作品不存在' });
      return;
    }
    const now = Date.now();
    const updated: SandboxProject = {
      ...project,
      data: req.body?.data ?? project.data,
      status: req.body?.status ?? project.status,
      visibility: req.body?.visibility ?? project.visibility,
      lastTestedAt: req.body?.status === 'draft' ? now : project.lastTestedAt,
      updatedAt: now
    };
    await context.sandbox.set(updated.id, updated);
    if (updated.status === 'published') {
      const work: WorkSubmission = {
        id: context.createId('work'),
        projectId: updated.id,
        ownerId: student.id,
        classId: student.classId,
        title: updated.title,
        likes: 0,
        comments: [],
        visibility: 'class',
        status: 'pending',
        createdAt: now
      };
      await context.works.set(work.id, work);
    }
    res.json(updated);
  });

  app.post('/api/student/library/:workId/comment', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const work = await context.works.get(req.params.workId);
    if (!work) {
      res.status(404).json({ message: '作品不存在' });
      return;
    }
    const student = req.user as StudentProfile;
    const comment = {
      id: context.createId('comment'),
      author: student.name,
      role: student.role,
      content: req.body?.content ?? '',
      createdAt: Date.now()
    };
    work.comments.push(comment);
    await context.works.set(work.id, work);
    res.status(201).json(comment);
  });

  app.get('/api/student/library', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const works = (await context.works.list()).filter((work) => work.classId === student.classId);
    res.json({ works });
  });

  app.post('/api/student/hints/:levelId', requireUser, requireRole('student'), async (req: RequestWithUser, res) => {
    const student = req.user as StudentProfile;
    const level = await context.levels.get(req.params.levelId);
    if (!level) {
      res.status(404).json({ message: '关卡不存在' });
      return;
    }
    const attemptsValue = Number(req.body?.attempts ?? 0);
    const payload: HintPayload = {
      attempts: Number.isFinite(attemptsValue) ? attemptsValue : 0,
      lastError: typeof req.body?.lastError === 'string' ? (req.body.lastError as HintPayload['lastError']) : undefined
    };
    const hint = computeHint(level, payload);
    telemetry.record({ type: 'hint', payload: { levelId: level.id, studentId: student.id, attempts: payload.attempts }, timestamp: Date.now() });
    res.json({ hint });
  });

  // 教师端
  app.get('/api/teacher/courses', requireUser, requireRole('teacher'), async (_req: RequestWithUser, res) => {
    const courses = await context.courses.list();
    res.json({ courses });
  });

  app.post('/api/teacher/courses', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const teacher = req.user as TeacherProfile;
    const id = context.createId('course');
    const course: CourseDefinition = {
      id,
      name: req.body?.name ?? '未命名课程',
      description: req.body?.description ?? '',
      chapterIds: []
    };
    teacher.courseIds.push(id);
    await Promise.all([
      context.courses.set(id, course),
      context.users.set(teacher.id, teacher)
    ]);
    res.status(201).json(course);
  });

  app.post('/api/teacher/courses/:courseId/chapters', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const course = await context.courses.get(req.params.courseId);
    if (!course) {
      res.status(404).json({ message: '课程不存在' });
      return;
    }
    const id = context.createId('chapter');
    const chapter = {
      id,
      title: req.body?.title ?? '未命名章节',
      order: course.chapterIds.length + 1,
      levelIds: [] as string[]
    };
    course.chapterIds.push(id);
    await Promise.all([
      context.chapters.set(id, chapter),
      context.courses.set(course.id, course)
    ]);
    res.status(201).json(chapter);
  });

  app.post('/api/teacher/chapters/:chapterId/levels', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const chapter = await context.chapters.get(req.params.chapterId);
    if (!chapter) {
      res.status(404).json({ message: '章节不存在' });
      return;
    }
    const level = req.body?.level;
    if (!level?.id) {
      res.status(400).json({ message: '缺少关卡定义' });
      return;
    }
    chapter.levelIds.push(level.id);
    await Promise.all([
      context.chapters.set(chapter.id, chapter),
      context.levels.set(level.id, level)
    ]);
    res.status(201).json(level);
  });

  app.put('/api/teacher/levels/:levelId', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const level = await context.levels.get(req.params.levelId);
    if (!level) {
      res.status(404).json({ message: '关卡不存在' });
      return;
    }
    const updated = { ...level, ...req.body };
    await context.levels.set(updated.id, updated);
    res.json(updated);
  });

  app.post('/api/teacher/classes/:classId/students', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const classDef = await context.classes.get(req.params.classId);
    if (!classDef) {
      res.status(404).json({ message: '班级不存在' });
      return;
    }
    const id = context.createId('student');
    const profile: StudentProfile = {
      id,
      name: req.body?.name ?? '新同学',
      role: 'student',
      classId: classDef.id,
      avatar: { equipped: 'starter-cape', unlocked: ['starter-cape'] },
      achievements: { badges: [], compendium: [] },
      settings: { volume: 0.8, lowMotion: false, language: 'zh-CN', resettable: true },
      sandboxUnlocked: false,
      progress: {}
    };
    classDef.studentIds.push(id);
    await Promise.all([
      context.users.set(id, profile),
      context.classes.set(classDef.id, classDef)
    ]);
    res.status(201).json(profile);
  });

  app.post('/api/teacher/classes/:classId/assign-course', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const classDef = await context.classes.get(req.params.classId);
    if (!classDef) {
      res.status(404).json({ message: '班级不存在' });
      return;
    }
    const { courseId } = req.body ?? {};
    if (typeof courseId !== 'string') {
      res.status(400).json({ message: '缺少课程 ID' });
      return;
    }
    if (!classDef.assignedCourseIds.includes(courseId)) {
      classDef.assignedCourseIds.push(courseId);
      await context.classes.set(classDef.id, classDef);
    }
    res.json(classDef);
  });

  app.patch('/api/teacher/classes/:classId/hint-limit', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const classDef = await context.classes.get(req.params.classId);
    if (!classDef) {
      res.status(404).json({ message: '班级不存在' });
      return;
    }
    const { hintLimit } = req.body ?? {};
    if (typeof hintLimit !== 'number') {
      res.status(400).json({ message: '缺少提示次数' });
      return;
    }
    classDef.hintLimit = hintLimit;
    await context.classes.set(classDef.id, classDef);
    res.json(classDef);
  });

  app.get('/api/teacher/analytics/progress', requireUser, requireRole('teacher'), async (_req: RequestWithUser, res) => {
    const classes = await context.classes.list();
    const payload = await Promise.all(
      classes.map(async (classDef) => {
        const students = await Promise.all(classDef.studentIds.map((id) => context.users.get(id)));
        return {
          classId: classDef.id,
          className: classDef.name,
          students: students
            .filter((student): student is StudentProfile => Boolean(student && student.role === 'student'))
            .map((student) => ({
              id: student.id,
              name: student.name,
              completed: Object.keys(student.progress).length
            }))
        };
      })
    );
    res.json({ classes: payload });
  });

  app.get('/api/teacher/analytics/heatmap', requireUser, requireRole('teacher'), async (_req: RequestWithUser, res) => {
    const students = (await context.users.list()).filter((user): user is StudentProfile => user.role === 'student');
    const heatmap = students.map((student) => ({
      studentId: student.id,
      entries: Object.values(student.progress).map((record) => ({
        levelId: record.levelId,
        stars: record.stars,
        duration: record.duration
      }))
    }));
    res.json({ heatmap });
  });

  app.get('/api/teacher/analytics/replays/:studentId/:levelId', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const records = await context.progress.get(req.params.studentId);
    const record = records?.find((item) => item.levelId === req.params.levelId);
    if (!record) {
      res.status(404).json({ message: '暂无回放' });
      return;
    }
    res.json({ replay: record.replayLog });
  });

  app.get('/api/teacher/works/pending', requireUser, requireRole('teacher'), async (_req: RequestWithUser, res) => {
    const works = (await context.works.list()).filter((work) => work.status === 'pending');
    res.json({ works });
  });

  app.post('/api/teacher/works/:workId/review', requireUser, requireRole('teacher'), async (req: RequestWithUser, res) => {
    const work = await context.works.get(req.params.workId);
    if (!work) {
      res.status(404).json({ message: '作品不存在' });
      return;
    }
    const { status } = req.body ?? {};
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: '无效审核状态' });
      return;
    }
    work.status = status;
    work.reviewedAt = Date.now();
    await context.works.set(work.id, work);
    res.json(work);
  });

  // 家长端
  app.get('/api/parent/children', requireUser, requireRole('parent'), async (req: RequestWithUser, res) => {
    const parent = req.user as ParentProfile;
    const children = await Promise.all(parent.childIds.map((id) => context.users.get(id)));
    res.json({
      children: children
        .filter((child): child is StudentProfile => Boolean(child && child.role === 'student'))
        .map((child) => ({
          id: child.id,
          name: child.name
        }))
    });
  });

  app.get('/api/parent/children/:childId/weekly-report', requireUser, requireRole('parent'), async (req: RequestWithUser, res) => {
    const report = await context.weeklyReports.get(req.params.childId);
    if (!report) {
      res.status(404).json({ message: '暂无周报' });
      return;
    }
    res.json(report);
  });

  app.get('/api/parent/children/:childId/progress', requireUser, requireRole('parent'), async (req: RequestWithUser, res) => {
    const records = await context.progress.get(req.params.childId);
    res.json({ progress: records ?? [] });
  });

  // 管理员
  app.get('/api/admin/overview', requireUser, requireRole('admin'), async (_req: RequestWithUser, res) => {
    const [users, classes, courses, sandbox] = await Promise.all([
      context.users.list(),
      context.classes.list(),
      context.courses.list(),
      context.sandbox.list()
    ]);
    res.json({
      activeUsers: users.length,
      classCount: classes.length,
      courseCount: courses.length,
      sandboxCount: sandbox.length
    });
  });

  app.post('/api/admin/assets', requireUser, requireRole('admin'), async (req: RequestWithUser, res) => {
    const asset = {
      id: context.createId('asset'),
      name: req.body?.name ?? '未命名资产',
      type: req.body?.type ?? 'document',
      version: 1,
      uploadedAt: Date.now(),
      metadata: req.body?.metadata ?? {}
    };
    await context.assets.set(asset.id, asset);
    res.status(201).json(asset);
  });

  app.post('/api/admin/users', requireUser, requireRole('admin'), async (req: RequestWithUser, res) => {
    const { role, name } = req.body ?? {};
    if (!['student', 'teacher', 'parent', 'admin'].includes(role)) {
      res.status(400).json({ message: '无效角色' });
      return;
    }
    const id = context.createId(role);
    const base = { id, name: name ?? '新用户', role } as UserProfile;
    await context.users.set(id, base);
    res.status(201).json(base);
  });

  app.get('/api/admin/exports/progress', requireUser, requireRole('admin'), async (_req: RequestWithUser, res) => {
    const entries = await context.progress.list();
    const exportRecord: ExportRecord = {
      id: context.createId('export'),
      generatedAt: Date.now(),
      type: 'progress',
      payload: entries
    };
    await context.exports.set(exportRecord.id, exportRecord);
    res.json(exportRecord);
  });

  app.get('/api/telemetry', async (_req, res) => {
    res.json(telemetry.query());
  });

  app.post('/api/telemetry', async (req, res) => {
    const { type, payload } = req.body ?? {};
    if (!type) {
      res.status(400).json({ message: '缺少事件类型' });
      return;
    }
    telemetry.record({ type, payload, timestamp: Date.now() });
    res.status(201).json({ ok: true });
  });

  return { app, context, telemetry };
}

export type { StudentProgressRecord, WeeklyReport };
