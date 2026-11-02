declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    DATABASE_URL_UNPOOLED?: string;
    NEON_BRANCH?: string;
    POSTGRES_URL?: string;
    SESSION_SECRET?: string;
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET_NAME?: string;
    APP_URL?: string;
    ADMIN_SEED_EMAIL?: string;
    ADMIN_SEED_PASSWORD?: string;
  }
}

export {};
