declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "production" | "development" | "test" | undefined;
      PORT: string;
      MONGODB_URL: string;
      ACCESS_TOKEN_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      REDIS_HOST: string;
      REDIS_PWD: string;
      REDIS_PORT: string;
      ALI_EMAIL_USER: string;
      ALI_EMAIL_PASS: string;
    }
  }
}

export {};
