declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_ENV?: 'development' | 'staging' | 'production';
      EXPO_PUBLIC_API_BASE_URL?: string;
      [key: string]: string | undefined;
    }
  }
}

export {};
