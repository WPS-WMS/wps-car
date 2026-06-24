import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExportJobStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

@Injectable()
export class ExportCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExportCleanupService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  onModuleInit() {
    void this.runCleanup();
    this.timer = setInterval(() => void this.runCleanup(), CLEANUP_INTERVAL_MS);
    this.logger.log('Limpeza periódica de exports agendada (intervalo 24h)');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runCleanup() {
    const retentionDays =
      this.config.get<number>('exports.retentionDays') ?? 7;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    let removed = 0;

    for (;;) {
      const stale = await this.prisma.exportJob.findMany({
        where: {
          status: { in: [ExportJobStatus.COMPLETED, ExportJobStatus.FAILED] },
          completedAt: { lt: cutoff },
        },
        take: BATCH_SIZE,
        orderBy: { completedAt: 'asc' },
      });

      if (stale.length === 0) {
        break;
      }

      for (const job of stale) {
        if (job.filePath) {
          await this.storage.deleteFile(job.filePath).catch((error) => {
            this.logger.warn(
              `Falha ao remover arquivo ${job.filePath}: ${String(error)}`,
            );
          });
        }

        await this.prisma.exportJob.delete({ where: { id: job.id } });
        removed += 1;
      }

      if (stale.length < BATCH_SIZE) {
        break;
      }
    }

    if (removed > 0) {
      this.logger.log(
        `Removidos ${removed} export(s) com mais de ${retentionDays} dia(s)`,
      );
    }
  }
}
