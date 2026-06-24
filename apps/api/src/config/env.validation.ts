import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  UPLOAD_DIR: string = './uploads';

  @IsInt()
  @Min(1)
  @IsOptional()
  MAX_FILE_SIZE_MB: number = 10;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  EXPORT_RETENTION_DAYS: number = 7;

  @IsString()
  @IsOptional()
  MARKET_LISTINGS_PROVIDER: string = 'mock';

  @IsString()
  @IsOptional()
  MARKET_LISTINGS_HTTP_URL?: string;

  @IsString()
  @IsOptional()
  MARKET_LISTINGS_HTTP_URLS?: string;

  @IsString()
  @IsOptional()
  MARKET_LISTINGS_HTTP_HEADERS?: string;

  @IsString()
  @IsOptional()
  MARKET_LISTINGS_HTTP_API_KEY?: string;

  @IsInt()
  @Min(1000)
  @IsOptional()
  MARKET_LISTINGS_HTTP_TIMEOUT_MS: number = 8000;

  @IsInt()
  @Min(1)
  @IsOptional()
  MARKET_LISTINGS_HTTP_MIN_SUCCESS: number = 1;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
