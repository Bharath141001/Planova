import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function warnIfDefault(key: string, defaultValue: string, value: string): void {
  if (isProd && value === defaultValue) {
    // eslint-disable-next-line no-console
    console.warn(`[env] WARNING: ${key} is using the insecure default value in production. Set a strong secret.`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT ?? '4000', 10),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),

  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  jwt: (() => {
    const accessSecret = required('JWT_SECRET', 'dev-access-secret');
    const refreshSecret = required('JWT_REFRESH_SECRET', 'dev-refresh-secret');
    warnIfDefault('JWT_SECRET', 'dev-access-secret', accessSecret);
    warnIfDefault('JWT_REFRESH_SECRET', 'dev-refresh-secret', refreshSecret);
    return {
      accessSecret,
      refreshSecret,
      accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
      refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
      refreshExpiresMs: 7 * 24 * 60 * 60 * 1000,
    };
  })(),

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    region: process.env.AWS_REGION ?? 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET ?? '',
    enabled: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET),
  },

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'Planova <no-reply@planova.dev>',
    enabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  },
} as const;

export type Env = typeof env;
