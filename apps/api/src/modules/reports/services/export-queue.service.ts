import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import { ExportJobsRepository } from '../export-jobs.repository';
import { ExportJobRunnerService } from './export-job.runner.service';

const QUEUE_NAME = 'export-jobs';

@Injectable()
export class ExportQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExportQueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly runner: ExportJobRunnerService,
    private readonly repository: ExportJobsRepository,
  ) {}

  async onModuleInit() {
    const url = this.config.get<string>('redis.url')?.trim();
    if (!url) {
      this.logger.log('REDIS_URL ausente — exports processados inline na API');
      return;
    }

    try {
      const connection = { url };

      this.queue = new Queue(QUEUE_NAME, { connection });
      this.worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          await this.runner.run(job.data.jobId as string, { markFailedOnError: false });
        },
        {
          connection,
          concurrency: 2,
        },
      );

      this.worker.on('failed', (job, error) => {
        if (!job) return;

        const maxAttempts = job.opts.attempts ?? 1;
        if (job.attemptsMade < maxAttempts) {
          this.logger.warn(
            `Export job ${job.data.jobId} tentativa ${job.attemptsMade}/${maxAttempts}: ${error.message}`,
          );
          return;
        }

        void this.repository
          .markFailed(
            job.data.jobId as string,
            error.message || 'Falha ao gerar exportação',
          )
          .catch(() => undefined);

        this.logger.error(`Export job ${job.data.jobId} esgotou tentativas na fila`);
      });

      this.logger.log('Fila BullMQ de exports ativa (concurrency: 2)');
    } catch (error) {
      this.queue = null;
      this.worker = null;
      this.logger.warn(
        `Falha ao iniciar fila de exports — fallback inline: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy() {
    await Promise.all([
      this.worker?.close(),
      this.queue?.close(),
    ]);
  }

  isQueueEnabled(): boolean {
    return this.queue !== null;
  }

  async enqueue(jobId: string): Promise<void> {
    if (this.queue) {
      await this.queue.add(
        'process',
        { jobId },
        {
          jobId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );
      return;
    }

    setImmediate(() => {
      void this.runner.run(jobId).catch(() => {
        // erros já registrados no runner
      });
    });
  }
}
