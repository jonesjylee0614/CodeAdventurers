import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, StudentProfile, User, Level, Chapter } from '../services/api/client';

export interface GameState {
  currentLevel?: Level;
  currentProgram: any[];
  simulationResult?: any;
  isRunning: boolean;
  hints: string[];
  attempts: number;
  lastError?: string;
}

export interface AppState {
  // 用户状态
  user?: User | StudentProfile;
  isLoggedIn: boolean;
  
  // 学生端数据
  chapters: Chapter[];
  currentChapter?: Chapter;
  
  // 游戏状态
  game: GameState;
  
  // UI状态
  loading: boolean;
  error?: string;
  
  // 动作
  setUser: (user: User | StudentProfile) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  
  // 认证动作
  loginAsGuest: (name?: string) => Promise<boolean>;
  joinClass: (inviteCode: string, name: string) => Promise<boolean>;
  
  // 学生端动作
  loadStudentData: () => Promise<void>;
  loadChapters: () => Promise<void>;
  
  // 游戏动作
  setCurrentLevel: (level: Level) => void;
  setProgram: (program: any[]) => void;
  runProgram: (programOverride?: any[]) => Promise<any | undefined>;
  completeLevel: (data: {
    stars: number;
    steps: number;
    hints?: number;
    duration?: number;
    bestDifference?: number;
  }) => Promise<void>;
  getHint: () => Promise<void>;
  resetGame: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isLoggedIn: false,
      chapters: [],
      game: {
        currentProgram: [],
        isRunning: false,
        hints: [],
        attempts: 0,
      },
      loading: false,

      // 基础动作
      setUser: (user) => {
        apiClient.setUserId(user.id);
        set({ user, isLoggedIn: true });
      },

      logout: () => {
        set({ 
          user: undefined, 
          isLoggedIn: false,
          chapters: [],
          game: {
            currentProgram: [],
            isRunning: false,
            hints: [],
            attempts: 0,
          }
        });
      },

      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),

      // 认证动作
      loginAsGuest: async (name) => {
        set({ loading: true, error: undefined });
        
        try {
          const response = await apiClient.loginAsGuest(name);
          
          if (response.error) {
            set({ error: response.error, loading: false });
            return false;
          }
          
          if (response.data) {
            const user: User = {
              id: response.data.userId,
              name: response.data.name,
              role: response.data.role as any,
            };
            
            get().setUser(user);
            set({ loading: false });
            return true;
          }
          
          return false;
        } catch (error) {
          set({ error: '登录失败', loading: false });
          return false;
        }
      },

      joinClass: async (inviteCode, name) => {
        set({ loading: true, error: undefined });
        
        try {
          const response = await apiClient.joinClass(inviteCode, name);
          
          if (response.error) {
            set({ error: response.error, loading: false });
            return false;
          }
          
          if (response.data) {
            const user: User = {
              id: response.data.userId,
              name,
              role: 'student',
              classId: response.data.classId,
            };
            
            get().setUser(user);
            set({ loading: false });
            return true;
          }
          
          return false;
        } catch (error) {
          set({ error: '加入班级失败', loading: false });
          return false;
        }
      },

      // 学生端动作
      loadStudentData: async () => {
        const { user } = get();
        if (!user || user.role !== 'student') return;

        set({ loading: true });

        try {
          const response = await apiClient.getStudentProfile();
          
          if (response.error) {
            set({ error: response.error, loading: false });
            return;
          }
          
          if (response.data) {
            set({ user: response.data, loading: false });
          }
        } catch (error) {
          set({ error: '加载学生数据失败', loading: false });
        }
      },

      loadChapters: async () => {
        const { user } = get();
        if (!user || user.role !== 'student') return;

        try {
          const response = await apiClient.getStudentMap();
          
          if (response.error) {
            set({ error: response.error });
            return;
          }
          
          if (response.data) {
            set({ chapters: response.data.chapters });
          }
        } catch (error) {
          set({ error: '加载章节数据失败' });
        }
      },

      // 游戏动作
      setCurrentLevel: (level) => {
        set({ 
          game: { 
            ...get().game, 
            currentLevel: level,
            currentProgram: [],
            simulationResult: undefined,
            hints: [],
            attempts: 0,
            lastError: undefined
          } 
        });
      },

      setProgram: (program) => {
        set({ 
          game: { 
            ...get().game, 
            currentProgram: program 
          } 
        });
      },

      runProgram: async (programOverride) => {
        const { game } = get();
        if (!game.currentLevel) return;

        set({
          game: {
            ...game,
            isRunning: true
          }
        });

        try {
          const program = Array.isArray(programOverride) ? programOverride : game.currentProgram;
          const response = await apiClient.runLevel(
            game.currentLevel.id,
            program
          );

          if (response.error) {
            set({
              error: response.error,
              game: {
                ...game,
                isRunning: false,
                attempts: game.attempts + 1,
                lastError: response.error
              }
            });
            return undefined;
          }

          if (response.data) {
            set({
              game: {
                ...game,
                currentProgram: program,
                simulationResult: response.data,
                isRunning: false,
                attempts: game.attempts + 1,
                lastError: response.data.success ? undefined : response.data.errorCode
              }
            });
            return response.data;
          }
        } catch (error) {
          set({
            error: '运行程序失败',
            game: {
              ...game,
              isRunning: false
            }
          });
          return undefined;
        }
      },

      completeLevel: async (data) => {
        const { game } = get();
        if (!game.currentLevel || !game.simulationResult?.success) return;

        try {
          const response = await apiClient.completeLevel(game.currentLevel.id, {
            ...data,
            replayLog: game.simulationResult.log
          });
          
          if (response.error) {
            set({ error: response.error });
            return;
          }

          // 重新加载章节数据以更新进度
          get().loadChapters();
        } catch (error) {
          set({ error: '完成关卡失败' });
        }
      },

      getHint: async () => {
        const { game } = get();
        if (!game.currentLevel) return;

        try {
          const response = await apiClient.getHint(game.currentLevel.id, {
            attempts: game.attempts,
            lastError: game.lastError
          });
          
          if (response.error) {
            set({ error: response.error });
            return;
          }
          
          if (response.data) {
            set({ 
              game: { 
                ...game, 
                hints: [...game.hints, response.data.hint] 
              } 
            });
          }
        } catch (error) {
          set({ error: '获取提示失败' });
        }
      },

      resetGame: () => {
        const { game } = get();
        set({ 
          game: { 
            ...game,
            currentProgram: [],
            simulationResult: undefined,
            hints: [],
            attempts: 0,
            lastError: undefined
          } 
        });
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isLoggedIn: state.isLoggedIn 
      }),
    }
  )
);
