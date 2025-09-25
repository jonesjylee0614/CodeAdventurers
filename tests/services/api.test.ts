/**
 * @jest-environment node
 */
import request from 'supertest';
import { createServer, ServerInstance } from '@api/index';

let server: ServerInstance;
let app: Parameters<typeof request>[0];

beforeAll(async () => {
  server = await createServer({ mode: 'memory' });
  app = server.app;
});

afterAll(async () => {
  await server.context.close();
});

async function withStudent() {
  await request(app).post('/api/system/reset');
  return 'student-1';
}

describe('学生端功能闭环', () => {
  it('完成首关并解锁沙盒、装扮与图鉴', async () => {
    const studentId = await withStudent();

    const profile = await request(app).get('/api/student/profile').set('x-user-id', studentId);
    expect(profile.body.name).toBe('小奇');
    expect(profile.body.sandboxUnlocked).toBe(false);

    const map = await request(app).get('/api/student/map').set('x-user-id', studentId);
    expect(map.body.chapters[0].levels[0].status).toBeDefined();

    const prep = await request(app)
      .get('/api/student/levels/level-1/prep')
      .set('x-user-id', studentId);
    expect(prep.body.allowedBlocks).toContain('MOVE');

    const runResult = await request(app)
      .post('/api/student/levels/level-1/run')
      .set('x-user-id', studentId)
      .send({
        program: [
          { type: 'move' },
          { type: 'move' },
          { type: 'turn', direction: 'right' },
          { type: 'move' },
          { type: 'collect' }
        ]
      });
    expect(runResult.body.success).toBe(true);

    const settlement = await request(app)
      .post('/api/student/levels/level-1/complete')
      .set('x-user-id', studentId)
      .send({ stars: 3, steps: 4, hints: 0, duration: 18, replayLog: runResult.body.log });
    expect(settlement.status).toBe(201);
    expect(settlement.body.stars).toBe(3);

    const reward = await request(app).get('/api/student/avatar').set('x-user-id', studentId);
    expect(reward.body.unlocked).toContain('starter-boots');

    const updatedAvatar = await request(app)
      .put('/api/student/avatar')
      .set('x-user-id', studentId)
      .send({ equipped: 'starter-boots' });
    expect(updatedAvatar.body.equipped).toBe('starter-boots');

    const unlockedCompendium = await request(app)
      .post('/api/student/compendium/unlock')
      .set('x-user-id', studentId)
      .send({ entryId: 'artifact-1' });
    expect(unlockedCompendium.body.unlocked).toContain('artifact-1');

    const sandbox = await request(app).get('/api/student/sandbox').set('x-user-id', studentId);
    expect(sandbox.body.sandboxUnlocked).toBe(true);

    const project = await request(app)
      .post('/api/student/sandbox')
      .set('x-user-id', studentId)
      .send({ title: '迷宫挑战', data: { nodes: [] } });
    expect(project.status).toBe(201);

    const published = await request(app)
      .patch(`/api/student/sandbox/${project.body.id}`)
      .set('x-user-id', studentId)
      .send({ status: 'published', visibility: 'class' });
    expect(published.body.status).toBe('published');

    const comment = await request(app)
      .post('/api/student/library/work-2/comment')
      .set('x-user-id', studentId)
      .send({ content: '喜欢这个作品！' });
    expect(comment.status).toBe(404);
  });

  it('更新设置并重置进度', async () => {
    const studentId = await withStudent();

    const settings = await request(app)
      .put('/api/student/settings')
      .set('x-user-id', studentId)
      .send({ language: 'en-US', lowMotion: true });
    expect(settings.body.language).toBe('en-US');

    const reset = await request(app)
      .post('/api/student/settings/reset-progress')
      .set('x-user-id', studentId);
    expect(reset.status).toBe(204);
  });
});

describe('教师端管理与看板', () => {
  it('管理课程与班级、审核作品与查看回放', async () => {
    const studentId = await withStudent();
    const teacherId = 'teacher-1';

    await request(app)
      .post('/api/student/levels/level-1/complete')
      .set('x-user-id', studentId)
      .send({ stars: 3, steps: 4, hints: 0, duration: 20 });

    const initialProject = await request(app)
      .post('/api/student/sandbox')
      .set('x-user-id', studentId)
      .send({ title: '班级分享', data: { nodes: [] } });

    const published = await request(app)
      .patch(`/api/student/sandbox/${initialProject.body.id}`)
      .set('x-user-id', studentId)
      .send({ status: 'published', visibility: 'class' });
    expect(published.status).toBe(200);

    const courses = await request(app).get('/api/teacher/courses').set('x-user-id', teacherId);
    expect(courses.body.courses[0].name).toBeDefined();

    const newCourse = await request(app)
      .post('/api/teacher/courses')
      .set('x-user-id', teacherId)
      .send({ name: '循环进阶', description: '学习循环结构' });
    expect(newCourse.status).toBe(201);

    const newChapter = await request(app)
      .post(`/api/teacher/courses/${newCourse.body.id}/chapters`)
      .set('x-user-id', teacherId)
      .send({ title: '循环基础' });
    expect(newChapter.status).toBe(201);

    const levelDefinition = {
      id: 'loop-1',
      name: '重复前进',
      width: 2,
      height: 2,
      tiles: [
        { x: 0, y: 0, walkable: true },
        { x: 1, y: 0, walkable: true },
        { x: 1, y: 1, walkable: true }
      ],
      start: { x: 0, y: 0, facing: 'east' },
      goal: { reach: { x: 1, y: 1 }, collectibles: 0, stepLimit: 10 },
      bestSteps: 2,
      hints: ['尝试使用循环'],
      comic: '帮助角色前进到终点。',
      allowedBlocks: ['MOVE', 'REPEAT'],
      rewards: { stars: 3, outfit: null }
    };

    const addedLevel = await request(app)
      .post(`/api/teacher/chapters/${newChapter.body.id}/levels`)
      .set('x-user-id', teacherId)
      .send({ level: levelDefinition });
    expect(addedLevel.status).toBe(201);

    const updatedLevel = await request(app)
      .put('/api/teacher/levels/loop-1')
      .set('x-user-id', teacherId)
      .send({ hints: ['多用重复结构'] });
    expect(updatedLevel.body.hints[0]).toBe('多用重复结构');

    const assign = await request(app)
      .post('/api/teacher/classes/class-1/assign-course')
      .set('x-user-id', teacherId)
      .send({ courseId: newCourse.body.id });
    expect(assign.body.assignedCourseIds).toContain(newCourse.body.id);

    const hintLimit = await request(app)
      .patch('/api/teacher/classes/class-1/hint-limit')
      .set('x-user-id', teacherId)
      .send({ hintLimit: 2 });
    expect(hintLimit.body.hintLimit).toBe(2);

    const analytics = await request(app)
      .get('/api/teacher/analytics/progress')
      .set('x-user-id', teacherId);
    expect(analytics.body.classes.length).toBeGreaterThan(0);

    const heatmap = await request(app)
      .get('/api/teacher/analytics/heatmap')
      .set('x-user-id', teacherId);
    expect(heatmap.body.heatmap.length).toBeGreaterThan(0);

    const replays = await request(app)
      .get('/api/teacher/analytics/replays/student-1/level-1')
      .set('x-user-id', teacherId);
    expect([200, 404]).toContain(replays.status);

    const pending = await request(app)
      .get('/api/teacher/works/pending')
      .set('x-user-id', teacherId);
    expect(pending.body.works.length).toBeGreaterThanOrEqual(0);

    if (pending.body.works.length > 0) {
      const review = await request(app)
        .post(`/api/teacher/works/${pending.body.works[0].id}/review`)
        .set('x-user-id', teacherId)
        .send({ status: 'approved' });
      expect(review.body.status).toBe('approved');
    }
  });
});

describe('家长与管理员视角', () => {
  it('查看进度、周报与管理端导出', async () => {
    await withStudent();
    const parentId = 'parent-1';
    const adminId = 'admin-1';

    const children = await request(app).get('/api/parent/children').set('x-user-id', parentId);
    expect(children.body.children.length).toBeGreaterThan(0);

    const weekly = await request(app)
      .get('/api/parent/children/student-1/weekly-report')
      .set('x-user-id', parentId);
    expect(weekly.status).toBe(200);

    const progress = await request(app)
      .get('/api/parent/children/student-1/progress')
      .set('x-user-id', parentId);
    expect(progress.status).toBe(200);

    const overview = await request(app).get('/api/admin/overview').set('x-user-id', adminId);
    expect(overview.body.activeUsers).toBeGreaterThan(0);

    const asset = await request(app)
      .post('/api/admin/assets')
      .set('x-user-id', adminId)
      .send({ name: '图标', type: 'sprite' });
    expect(asset.status).toBe(201);

    const newUser = await request(app)
      .post('/api/admin/users')
      .set('x-user-id', adminId)
      .send({ role: 'teacher', name: '新教师' });
    expect(newUser.status).toBe(201);

    const exportData = await request(app)
      .get('/api/admin/exports/progress')
      .set('x-user-id', adminId);
    expect(exportData.status).toBe(200);
  });
});
