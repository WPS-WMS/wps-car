import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type MemoryEntry = { value: string; expiresAt: number };

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly keyPrefix = 'wps:';
  private readonly memory = new Map<string, MemoryEntry>();
  private redis: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('redis.url')?.trim();
    if (!url) {
      this.logger.log('REDIS_URL não configurado — cache in-memory ativo');
      return;
    }

    try {
      const client = new Redis(url, {
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      await client.connect();
      await client.ping();
      this.redis = client;
      this.logger.log('Cache Redis conectado');
    } catch (error) {
      this.logger.warn(
        `Falha ao conectar Redis — usando cache in-memory: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  isRedisEnabled(): boolean {
    return this.redis !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.fullKey(key);

    if (this.redis) {
      try {
        const raw = await this.redis.get(fullKey);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    }

    const entry = this.memory.get(fullKey);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.memory.delete(fullKey);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    const fullKey = this.fullKey(key);
    const serialized = JSON.stringify(value);

    if (this.redis) {
      try {
        await this.redis.set(fullKey, serialized, 'PX', ttlMs);
      } catch {
        // falha silenciosa — próxima leitura recarrega do banco
      }
      return;
    }

    this.memory.set(fullKey, {
      value: serialized,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.fullKey(key);

    if (this.redis) {
      try {
        await this.redis.del(fullKey);
      } catch {
        // ignore
      }
      return;
    }

    this.memory.delete(fullKey);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const fullPrefix = this.fullKey(prefix);

    if (this.redis) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await this.redis.scan(
            cursor,
            'MATCH',
            `${fullPrefix}*`,
            'COUNT',
            100,
          );
          cursor = nextCursor;
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } while (cursor !== '0');
      } catch {
        // ignore
      }
      return;
    }

    for (const key of this.memory.keys()) {
      if (key.startsWith(fullPrefix)) {
        this.memory.delete(key);
      }
    }
  }

  async deleteWhere(matcher: (logicalKey: string) => boolean): Promise<void> {
    if (this.redis) {
      try {
        let cursor = '0';
        const prefix = this.keyPrefix;
        do {
          const [nextCursor, keys] = await this.redis.scan(
            cursor,
            'MATCH',
            `${prefix}*`,
            'COUNT',
            100,
          );
          cursor = nextCursor;

          const toDelete = keys.filter((key) =>
            matcher(key.slice(prefix.length)),
          );
          if (toDelete.length > 0) {
            await this.redis.del(...toDelete);
          }
        } while (cursor !== '0');
      } catch {
        // ignore
      }
      return;
    }

    for (const key of this.memory.keys()) {
      const logicalKey = key.slice(this.keyPrefix.length);
      if (matcher(logicalKey)) {
        this.memory.delete(key);
      }
    }
  }

  private fullKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
