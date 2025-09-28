const API_BASE = 'http://localhost:8081/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  classId?: string;
}

export interface StudentProfile extends User {
  role: 'student';
  classId: string;
  avatar: {
    equipped: string;
    unlocked: string[];
  };
  achievements: {
    badges: string[];
    compendium: string[];
  };
  settings: {
    volume: number;
    lowMotion: boolean;
    language: string;
    resettable: boolean;
  };
  sandboxUnlocked: boolean;
  progress: Record<string, any>;
}

export interface ParentSettings {
  reminderTime: string;
  weeklyReportDay: string;
  notifyChannels: Array<'app' | 'email' | 'sms'>;
}

export interface TeacherProfile extends User {
  role: 'teacher';
  managedClassIds: string[];
  courseIds: string[];
}

export interface ParentProfile extends User {
  role: 'parent';
  childIds: string[];
  settings: ParentSettings;
}

export interface StudentLevelProgress {
  levelId: string;
  stars: number;
  steps: number;
  hints: number;
  duration: number;
  bestDifference: number;
}

export interface ParentProgressRecord {
  levelId: string;
  stars: number;
  steps: number;
  hints: number;
  duration: number;
  bestDifference: number;
  completedAt: number;
  replayLog: unknown[];
}

export interface WeeklyReport {
  childId: string;
  generatedAt: number;
  summary: string;
  conceptsLearned: string[];
  commonMistakes: string[];
  recommendations: string[];
}

export interface TeacherCourseChapter {
  id: string;
  title: string;
  order: number;
  levels: Array<{ id: string; name: string; bestSteps: number; rewards: { stars: number; outfit: string | null } }>;
}

export interface TeacherCourse {
  id: string;
  name: string;
  description: string;
  chapters: TeacherCourseChapter[];
}

export interface TeacherClassSummary {
  id: string;
  name: string;
  inviteCode: string;
  studentCount: number;
  hintLimit: number;
  activeStudents: number;
  averageProgress: number;
  completionRate: number;
  courseCount: number;
  levelCount: number;
  courses: Array<{ id: string; name: string; chapterCount: number }>;
}

export interface TeacherClassDetail {
  class: {
    id: string;
    name: string;
    inviteCode: string;
    hintLimit: number;
    studentCount: number;
    levelCount: number;
    averageProgress: number;
    completionRate: number;
  };
  students: Array<{
    id: string;
    name: string;
    completedLevels: number;
    totalLevels: number;
    stars: number;
    lastActiveAt: number | null;
  }>;
  courses: Array<{
    id: string;
    name: string;
    description: string;
    chapters: Array<{
      id: string;
      title: string;
      order: number;
      levelCount: number;
      levels: Array<{ id: string; name: string; bestSteps: number; rewards: { stars: number; outfit: string | null } }>;
    }>;
  }>;
  recentActivities: Array<{
    studentId: string;
    studentName: string;
    levelId: string;
    stars: number;
    completedAt: number;
  }>;
  pendingWorks: Array<{
    id: string;
    title: string;
    ownerId: string;
    status: string;
    createdAt: number;
  }>;
}

export interface ParentOverview {
  children: Array<{
    id: string;
    name: string;
    classId: string;
    completedLevels: number;
    totalDuration: number;
    lastActiveAt: number | null;
    weeklyReport?: WeeklyReport;
  }>;
  settings: ParentSettings;
}

export interface Level {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Array<{
    x: number;
    y: number;
    walkable: boolean;
    collectible?: string;
  }>;
  start: { x: number; y: number; facing: 'north' | 'south' | 'east' | 'west' };
  goal: any;
  bestSteps: number;
  hints: string[];
  allowedBlocks?: string[];
  comic?: string;
  rewards?: { outfit?: string };
  chapterId?: string;
  status?: 'locked' | 'unlocked' | 'completed';
  progress?: StudentLevelProgress | null;
}

export interface Chapter {
  id: string;
  title: string;
  levels: Array<{
    id: string;
    name: string;
    status: 'locked' | 'unlocked' | 'completed';
    stars: number;
    bestDifference: number | null;
  }>;
}

class ApiClient {
  private userId: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }
    return headers;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '网络错误' };
    }
  }

  async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '网络错误' };
    }
  }

  async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '网络错误' };
    }
  }

  async patch<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : '网络错误' };
    }
  }

  // 认证相关
  async loginAsGuest(name?: string): Promise<ApiResponse<{ userId: string; name: string; role: string }>> {
    return this.post('/auth/guest', { name });
  }

  async joinClass(inviteCode: string, name: string): Promise<ApiResponse<{ userId: string; classId: string }>> {
    return this.post('/auth/class', { inviteCode, name });
  }

  async loginWithCredentials(payload: {
    identifier: string;
    password: string;
    role: 'teacher' | 'parent' | 'admin' | 'student';
  }): Promise<ApiResponse<{ user: TeacherProfile | ParentProfile | User }>> {
    return this.post('/auth/login', payload);
  }

  // 学生端API
  async getStudentProfile(): Promise<ApiResponse<StudentProfile>> {
    return this.get('/student/profile');
  }

  async getStudentMap(): Promise<ApiResponse<{ chapters: Chapter[] }>> {
    return this.get('/student/map');
  }

  async getLevelPrep(levelId: string): Promise<ApiResponse<{
    levelId: string;
    victoryCondition: any;
    allowedBlocks: string[];
    comic?: string;
    rewards?: any;
  }>> {
    return this.get(`/student/levels/${levelId}/prep`);
  }

  async getStudentLevel(levelId: string): Promise<ApiResponse<Level>> {
    return this.get(`/student/levels/${levelId}`);
  }

  async runLevel(levelId: string, program: any[]): Promise<ApiResponse<any>> {
    return this.post(`/student/levels/${levelId}/run`, { program });
  }

  async completeLevel(levelId: string, data: {
    stars: number;
    steps: number;
    hints?: number;
    duration?: number;
    bestDifference?: number;
    replayLog?: any[];
  }): Promise<ApiResponse<any>> {
    return this.post(`/student/levels/${levelId}/complete`, data);
  }

  async getHint(levelId: string, payload: { attempts: number; lastError?: string }): Promise<ApiResponse<{ hint: string }>> {
    return this.post(`/student/hints/${levelId}`, payload);
  }

  async getStudentSettings(): Promise<ApiResponse<any>> {
    return this.get('/student/settings');
  }

  async updateStudentSettings(settings: any): Promise<ApiResponse<any>> {
    return this.put('/student/settings', settings);
  }

  async resetStudentProgress(): Promise<ApiResponse<void>> {
    return this.post('/student/settings/reset-progress');
  }

  async getStudentAvatar(): Promise<ApiResponse<{ equipped: string; unlocked: string[] }>> {
    return this.get('/student/avatar');
  }

  async updateStudentAvatar(equipped: string): Promise<ApiResponse<{ equipped: string; unlocked: string[] }>> {
    return this.put('/student/avatar', { equipped });
  }

  // 教师端API
  async getTeacherCourses(): Promise<ApiResponse<{ courses: TeacherCourse[] }>> {
    return this.get('/teacher/courses');
  }

  async getTeacherAnalytics(): Promise<ApiResponse<any>> {
    return this.get('/teacher/analytics/progress');
  }

  async getTeacherHeatmap(): Promise<ApiResponse<{ heatmap: Array<{ studentId: string; entries: Array<{ levelId: string; stars: number; duration: number }> }> }>> {
    return this.get('/teacher/analytics/heatmap');
  }

  async getTeacherClasses(): Promise<ApiResponse<{ classes: TeacherClassSummary[] }>> {
    return this.get('/teacher/classes');
  }

  async getTeacherClassDetail(classId: string): Promise<ApiResponse<TeacherClassDetail>> {
    return this.get(`/teacher/classes/${classId}`);
  }

  async getTeacherPendingWorks(): Promise<ApiResponse<{ works: any[] }>> {
    return this.get('/teacher/works/pending');
  }

  async reviewTeacherWork(workId: string, status: 'approved' | 'rejected'): Promise<ApiResponse<any>> {
    return this.post(`/teacher/works/${workId}/review`, { status });
  }

  async assignCourseToClass(classId: string, courseId: string): Promise<ApiResponse<any>> {
    return this.post(`/teacher/classes/${classId}/assign-course`, { courseId });
  }

  async updateClassHintLimit(classId: string, hintLimit: number): Promise<ApiResponse<any>> {
    return this.patch(`/teacher/classes/${classId}/hint-limit`, { hintLimit });
  }

  // 家长端API
  async getParentChildren(): Promise<ApiResponse<{ children: Array<{ id: string; name: string }> }>> {
    return this.get('/parent/children');
  }

  async getParentOverview(): Promise<ApiResponse<ParentOverview>> {
    return this.get('/parent/overview');
  }

  async getParentWeeklyReport(childId: string): Promise<ApiResponse<WeeklyReport>> {
    return this.get(`/parent/children/${childId}/weekly-report`);
  }

  async getParentProgress(childId: string): Promise<ApiResponse<{ progress: ParentProgressRecord[] }>> {
    return this.get(`/parent/children/${childId}/progress`);
  }

  async getParentSettings(): Promise<ApiResponse<ParentSettings>> {
    return this.get('/parent/settings');
  }

  async updateParentSettings(settings: Partial<ParentSettings> & { notifyChannels?: ParentSettings['notifyChannels'] }): Promise<ApiResponse<ParentSettings>> {
    return this.put('/parent/settings', settings);
  }

  // 管理员API (基础结构)
  async getAdminOverview(): Promise<ApiResponse<{
    activeUsers: number;
    classCount: number;
    courseCount: number;
    sandboxCount: number;
  }>> {
    return this.get('/admin/overview');
  }
}

export const apiClient = new ApiClient();
