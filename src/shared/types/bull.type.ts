import Bull from 'bull';

export type QueueHandler = (job: Bull.Job) => Promise<void>;
