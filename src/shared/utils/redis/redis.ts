import type { RedisClientType } from 'redis';
import * as redis from 'redis';
import { singleton } from 'tsyringe';

import { redis as redisConfig } from '@config/env';

@singleton()
export class Redis {
  private instance: RedisClientType;
  private connected = false;

  constructor() {
    this.instance = redis.createClient({ url: redisConfig.url });

    // Non-blocking connect — server starts even if Redis is unavailable
    this.instance
      .connect()
      .then(() => {
        this.connected = true;
        console.info('Redis instance connected 🐧');
      })
      .catch((err) => {
        this.connected = false;
        console.warn(`⚠️ Redis connection failed (non-fatal): ${err.message}`);
        console.warn('⚠️ Features requiring Redis (client invitation caching, OTP) will be unavailable');
      });

    this.instance.on('error', (err) => {
      this.connected = false;
      console.error('Redis error:', err.message);
    });

    this.instance.on('reconnecting', () => {
      console.info('Redis reconnecting...');
    });

    this.instance.on('ready', () => {
      this.connected = true;
      console.info('Redis ready 🐧');
    });
  }

  getInstance(): RedisClientType {
    if (!this.instance) {
      new Redis();
    }
    return this.instance;
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect() {
    if (this.instance) {
      this.instance.quit().catch(() => {});
    }
  }
}
