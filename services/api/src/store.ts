import { LevelDefinition } from '../../../packages/engine/src/index.ts';
import { Pool, PoolOptions, RowDataPacket, createPool } from 'mysql2/promise';

function resolveMysqlUrl(): string | undefined {
  const directUrl = process.env.MYSQL_URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const database = process.env.MYSQL_DATABASE?.trim();

  if (!host || !user || !database) {
    return undefined;
  }

  const port = process.env.MYSQL_PORT?.trim();
  const passwordRaw = process.env.MYSQL_PASSWORD;
  const hasPassword = passwordRaw !== undefined;
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = hasPassword ? `:${encodeURIComponent(passwordRaw ?? '')}` : '';
  const hostPort = `${encodeURIComponent(host)}${port ? `:${port}` : ''}`;
  const encodedDatabase = encodeURIComponent(database);

  return `mysql://${encodedUser}${encodedPassword}@${hostPort}/${encodedDatabase}`;
}

function cloneDeep<T>(value: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export type Role = 'student' | 'teacher' | 'parent' | 'admin';

export interface UserBase {
  id: string;
  name: string;
  role: Role;
}

export interface StudentSettings {
  volume: number;
  lowMotion: boolean;
  language: string;
  resettable: boolean;
}

export interface StudentProfile extends UserBase {
  role: 'student';
  classId: string;
  inviteCode?: string;
  avatar: {
    equipped: string;
    unlocked: string[];
  };
  achievements: {
    badges: string[];
    compendium: string[];
  };
  settings: StudentSettings;
  sandboxUnlocked: boolean;
  progress: Record<string, StudentProgressRecord>;
}

export interface TeacherProfile extends UserBase {
  role: 'teacher';
  managedClassIds: string[];
  courseIds: string[];
}

export interface ParentProfile extends UserBase {
  role: 'parent';
  childIds: string[];
}

export interface AdminProfile extends UserBase {
  role: 'admin';
}

export type UserProfile = StudentProfile | TeacherProfile | ParentProfile | AdminProfile;

export interface ChapterDefinition {
  id: string;
  title: string;
  order: number;
  levelIds: string[];
}

export interface CourseDefinition {
  id: string;
  name: string;
  description: string;
  chapterIds: string[];
}

export interface ClassDefinition {
  id: string;
  name: string;
  inviteCode: string;
  teacherId: string;
  studentIds: string[];
  assignedCourseIds: string[];
  hintLimit: number;
}

export interface StudentProgressRecord {
  levelId: string;
  stars: number;
  steps: number;
  hints: number;
  duration: number;
  bestDifference: number;
  completedAt: number;
  replayLog: unknown[];
}

export interface SandboxProject {
  id: string;
  ownerId: string;
  title: string;
  data: unknown;
  status: 'draft' | 'published';
  visibility: 'private' | 'class';
  lastTestedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface WorkSubmission {
  id: string;
  projectId: string;
  ownerId: string;
  classId: string;
  title: string;
  likes: number;
  comments: Array<{ id: string; author: string; role: Role; content: string; createdAt: number }>;
  visibility: 'class' | 'teachers' | 'parents';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
}

export interface CompendiumEntry {
  id: string;
  chapterId: string;
  name: string;
  description: string;
}

export interface WeeklyReport {
  childId: string;
  generatedAt: number;
  summary: string;
  conceptsLearned: string[];
  commonMistakes: string[];
  recommendations: string[];
}

export interface AssetRecord {
  id: string;
  name: string;
  type: 'sprite' | 'audio' | 'document';
  version: number;
  uploadedAt: number;
  metadata: Record<string, unknown>;
}

export interface ExportRecord {
  id: string;
  generatedAt: number;
  type: 'progress' | 'telemetry';
  payload: unknown;
}

export interface EntityStore<T> {
  get(id: string): Promise<T | undefined>;
  set(id: string, value: T): Promise<void>;
  list(): Promise<T[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface DataContext {
  users: EntityStore<UserProfile>;
  classes: EntityStore<ClassDefinition>;
  courses: EntityStore<CourseDefinition>;
  chapters: EntityStore<ChapterDefinition>;
  levels: EntityStore<LevelDefinition & { chapterId: string; comic: string; allowedBlocks: string[]; rewards: { stars: number; outfit: string | null } }>;
  progress: EntityStore<StudentProgressRecord[]>;
  sandbox: EntityStore<SandboxProject>;
  works: EntityStore<WorkSubmission>;
  compendium: EntityStore<CompendiumEntry>;
  weeklyReports: EntityStore<WeeklyReport>;
  assets: EntityStore<AssetRecord>;
  exports: EntityStore<ExportRecord>;
  reset(): Promise<void>;
  close(): Promise<void>;
  createId(prefix: string): string;
}

export interface CreateDataContextOptions {
  mode?: 'memory' | 'mysql';
  tablePrefix?: string;
  pool?: Pool;
  mysql?: PoolOptions & { database?: string };
}

class InMemoryEntityStore<T> implements EntityStore<T> {
  private readonly map = new Map<string, T>();

  async get(id: string): Promise<T | undefined> {
    const value = this.map.get(id);
    return value ? cloneDeep(value) : undefined;
  }

  async set(id: string, value: T): Promise<void> {
    this.map.set(id, cloneDeep(value));
  }

  async list(): Promise<T[]> {
    return Array.from(this.map.values()).map((value) => cloneDeep(value));
  }

  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }

  async clear(): Promise<void> {
    this.map.clear();
  }
}

class MySqlEntityStore<T> implements EntityStore<T> {
  constructor(private readonly pool: Pool, private readonly table: string) {}

  async get(id: string): Promise<T | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT data FROM \`${this.table}\` WHERE id = ? LIMIT 1`, [id]);
    if (rows.length === 0) {
      return undefined;
    }
    const row = rows[0];
    const payload = row.data ?? row.DATA;
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return parsed as T;
  }

  async set(id: string, value: T): Promise<void> {
    const data = JSON.stringify(value);
    await this.pool.execute(
      `INSERT INTO \`${this.table}\` (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)`,
      [id, data]
    );
  }

  async list(): Promise<T[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT data FROM \`${this.table}\``);
    return rows.map((row) => {
      const payload = row.data ?? row.DATA;
      return (typeof payload === 'string' ? JSON.parse(payload) : payload) as T;
    });
  }

  async delete(id: string): Promise<void> {
    await this.pool.execute(`DELETE FROM \`${this.table}\` WHERE id = ?`, [id]);
  }

  async clear(): Promise<void> {
    await this.pool.execute(`TRUNCATE TABLE \`${this.table}\``);
  }
}

async function ensureTables(pool: Pool, prefix: string): Promise<void> {
  const tables: Record<keyof Omit<DataContext, 'reset' | 'close' | 'createId'>, string> = {
    users: `${prefix}users`,
    classes: `${prefix}classes`,
    courses: `${prefix}courses`,
    chapters: `${prefix}chapters`,
    levels: `${prefix}levels`,
    progress: `${prefix}student_progress`,
    sandbox: `${prefix}sandbox_projects`,
    works: `${prefix}work_submissions`,
    compendium: `${prefix}compendium_entries`,
    weeklyReports: `${prefix}weekly_reports`,
    assets: `${prefix}asset_records`,
    exports: `${prefix}export_records`
  } as const;

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.users}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    name VARCHAR(128) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.name'))) STORED,
    role ENUM('student','teacher','parent','admin') GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.role'))) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.classes}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.courses}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.chapters}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.levels}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.progress}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.sandbox}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.works}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.compendium}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.weeklyReports}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.assets}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`CREATE TABLE IF NOT EXISTS \`${tables.exports}\` (
    id VARCHAR(64) PRIMARY KEY,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

export async function createDataContext(options: CreateDataContextOptions = {}): Promise<DataContext> {

  const mysqlUrl = resolveMysqlUrl();
  const mode = options.mode ?? (mysqlUrl ? 'mysql' : 'memory');

  const prefix = options.tablePrefix ?? process.env.MYSQL_TABLE_PREFIX ?? '';
  let pool = options.pool;
  let ownsPool = false;

  if (mode === 'mysql') {
    if (!pool) {

      if (mysqlUrl) {
        pool = createPool({ uri: mysqlUrl, waitForConnections: true, connectionLimit: 10 });
      } else if (options.mysql) {
        pool = createPool({ waitForConnections: true, connectionLimit: 10, ...options.mysql });
      } else {
        throw new Error('MySQL mode requires MYSQL_URL (or MYSQL_HOST/MYSQL_USER/MYSQL_DATABASE) or explicit connection options.');

      }
      ownsPool = true;
    }
    await ensureTables(pool!, prefix);
  }

  const factory = (table: string): EntityStore<any> => {
    if (mode === 'mysql') {
      return new MySqlEntityStore(pool!, `${prefix}${table}`);
    }
    return new InMemoryEntityStore();
  };

  const users = factory('users') as EntityStore<UserProfile>;
  const classes = factory('classes') as EntityStore<ClassDefinition>;
  const courses = factory('courses') as EntityStore<CourseDefinition>;
  const chapters = factory('chapters') as EntityStore<ChapterDefinition>;
  const levels = factory('levels') as EntityStore<LevelDefinition & { chapterId: string; comic: string; allowedBlocks: string[]; rewards: { stars: number; outfit: string | null } }>;
  const progress = factory('student_progress') as EntityStore<StudentProgressRecord[]>;
  const sandbox = factory('sandbox_projects') as EntityStore<SandboxProject>;
  const works = factory('work_submissions') as EntityStore<WorkSubmission>;
  const compendium = factory('compendium_entries') as EntityStore<CompendiumEntry>;
  const weeklyReports = factory('weekly_reports') as EntityStore<WeeklyReport>;
  const assets = factory('asset_records') as EntityStore<AssetRecord>;
  const exportsStore = factory('export_records') as EntityStore<ExportRecord>;

  let idCounter = 0;

  return {
    users,
    classes,
    courses,
    chapters,
    levels,
    progress,
    sandbox,
    works,
    compendium,
    weeklyReports,
    assets,
    exports: exportsStore,
    async reset() {
      await Promise.all([
        users.clear(),
        classes.clear(),
        courses.clear(),
        chapters.clear(),
        levels.clear(),
        progress.clear(),
        sandbox.clear(),
        works.clear(),
        compendium.clear(),
        weeklyReports.clear(),
        assets.clear(),
        exportsStore.clear()
      ]);
      idCounter = 0;
    },
    async close() {
      if (ownsPool && pool) {
        await pool.end();
      }
    },
    createId(prefix: string) {
      idCounter += 1;
      return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
    }
  };
}

export type { StudentProgressRecord as ProgressRecordType };
