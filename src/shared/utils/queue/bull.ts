import Bull from 'bull';
import { singleton } from 'tsyringe';

import { queueConfig, redis } from '@/config/env';
import { QueueRegistry } from '@/shared/interface/bull';
import { QueueHandler } from '@/shared/types/bull.type';

@singleton()
class PylottQueue {
  private static instance: PylottQueue;
  private queues: QueueRegistry = {};
  private traceId = '[PYLOTT_QUEUE]';

  public static getInstance(): PylottQueue {
    if (!PylottQueue.instance) {
      PylottQueue.instance = new PylottQueue();
    }
    return PylottQueue.instance;
  }

  public registerQueue(queueName: string): Bull.Queue {
    if (this.queues[queueName]) {
      return this.queues[queueName].bull;
    }

    const queue = new Bull(queueName, {
      redis: {
        port: Number(redis.port),
        host: redis.host,
        password: redis.password,
        tls: {},
      },
      limiter: queueConfig,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.queues[queueName] = {
      bull: queue,
      handlers: {},
    };

    this.setupEventListeners(queue);

    return queue;
  }

  public registerHandler(queueName: string, jobName: string, handler: QueueHandler): void {
    if (!this.queues[queueName]) {
      throw new Error(`${this.traceId} Queue ${queueName} not registered`);
    }

    this.queues[queueName].handlers[jobName] = handler;

    this.queues[queueName].bull.process(jobName, async (job) => {
      try {
        await handler(job);
        // console.log(`${this.traceId} handler result for job ${jobName} ===> ${JSON.stringify(result)}`);
      } catch (error) {
        console.error(`${this.traceId} handler error for job ${jobName} ===> ${error.message}`, error.stack);
        throw error;
      }
    });
  }

  public getQueue(queueName: string): Bull.Queue {
    const queue = this.queues[queueName]?.bull;
    if (!queue) {
      throw new Error(`Queue ${queueName} not registered`);
    }
    return queue;
  }

  private setupEventListeners(queue: Bull.Queue): void {
    queue.on('completed', (job) => {
      console.log(`Job ${job.id} completed in queue ${queue.name}`);
    });

    queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} failed in queue ${queue.name}: ${error.message}`);
    });

    queue.on('error', (error) => {
      console.error(`Queue ${queue.name} error: ${error.message}`);
    });

    queue.on('waiting', (jobId) => {
      console.log(`Job ${jobId} waiting in queue ${queue.name}`);
    });

    queue.on('active', (job) => {
      console.log(`Job ${job.id} started in queue ${queue.name}`);
    });
  }

  public async closeAll(): Promise<void> {
    await Promise.all(
      Object.values(this.queues).map(async (queue) => {
        await queue.bull.close();
      }),
    );
    this.queues = {};
  }
}

export { PylottQueue };
