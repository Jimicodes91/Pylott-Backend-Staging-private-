import Bull from 'bull';
import { QueueHandler } from '../types/bull.type';

export interface QueueRegistry {
  [queueName: string]: {
    bull: Bull.Queue;
    handlers: {
      [jobName: string]: QueueHandler;
    };
  };
}
