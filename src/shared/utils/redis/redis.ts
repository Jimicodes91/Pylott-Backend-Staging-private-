import type { RedisClientType } from 'redis';
import * as redis from 'redis';
import { singleton } from 'tsyringe';

import { redis as redisConfig } from '@config/env';

@singleton()
export class Redis {
  private instance: RedisClientType;

  constructor() {
    this.instance = redis.createClient({ url: redisConfig.url });

    this.instance.connect();

    this.instance.on('connect', () => {
      console.info('Redis instance connected 🐧');
    });

    this.instance.on('error', (err) => {
      console.error(err, 'An error occurred connecting to Redis instance 🐧');
    });
  }

  getInstance(): RedisClientType {
    if (!this.instance) {
      new Redis();
    }

    return this.instance;
  }

  disconnect() {
    if (this.instance) {
      this.instance.quit();
    }
  }
}
