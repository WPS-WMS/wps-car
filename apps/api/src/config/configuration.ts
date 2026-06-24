export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  upload: {
    dir: process.env.UPLOAD_DIR ?? './uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '10', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  mail: {
    enabled: process.env.MAIL_ENABLED === 'true',
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM ?? 'noreply@wpscar.com.br',
  },
  webAppUrl: process.env.WEB_APP_URL ?? 'http://localhost:3000',
  auth: {
    passwordResetExpiresMinutes: parseInt(
      process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? '60',
      10,
    ),
  },
  fipe: {
    provider: process.env.FIPE_LOOKUP_PROVIDER ?? 'mock',
    httpUrl: process.env.FIPE_LOOKUP_HTTP_URL ?? '',
    httpTimeoutMs: parseInt(process.env.FIPE_LOOKUP_HTTP_TIMEOUT_MS ?? '8000', 10),
  },
  redis: {
    url: process.env.REDIS_URL ?? '',
  },
  exports: {
    retentionDays: parseInt(process.env.EXPORT_RETENTION_DAYS ?? '7', 10),
  },
  market: {
    provider: process.env.MARKET_LISTINGS_PROVIDER ?? 'mock',
    httpUrl: process.env.MARKET_LISTINGS_HTTP_URL ?? '',
    httpUrls: process.env.MARKET_LISTINGS_HTTP_URLS ?? '',
    httpHeaders: process.env.MARKET_LISTINGS_HTTP_HEADERS ?? '',
    httpApiKey: process.env.MARKET_LISTINGS_HTTP_API_KEY ?? '',
    httpTimeoutMs: parseInt(process.env.MARKET_LISTINGS_HTTP_TIMEOUT_MS ?? '8000', 10),
    httpMinSuccess: parseInt(process.env.MARKET_LISTINGS_HTTP_MIN_SUCCESS ?? '1', 10),
  },
});
