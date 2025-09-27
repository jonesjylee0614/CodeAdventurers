export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export const apiClient = {
  async get<T>(path: string): Promise<ApiResponse<T>> {
    // 适配层：未来接入真实后端
    // eslint-disable-next-line no-console
    console.log('[API] GET', path);
    return { data: {} as T };
  },
};
