const API_BASE = 'http://localhost:3000/api';

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
  start: { x: number; y: number; facing: string };
  goal: any;
  bestSteps: number;
  hints: string[];
  allowedBlocks?: string[];
  comic?: string;
  rewards?: { outfit?: string };
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

  setUserId(userId: string) {
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

  async updateStudentSettings(settings: any): Promise<ApiResponse<any>> {
    return this.put('/student/settings', settings);
  }

  // 教师端API (基础结构)
  async getTeacherCourses(): Promise<ApiResponse<{ courses: any[] }>> {
    return this.get('/teacher/courses');
  }

  async getTeacherAnalytics(): Promise<ApiResponse<any>> {
    return this.get('/teacher/analytics/progress');
  }

  // 家长端API (基础结构) 
  async getParentChildren(): Promise<ApiResponse<{ children: any[] }>> {
    return this.get('/parent/children');
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
