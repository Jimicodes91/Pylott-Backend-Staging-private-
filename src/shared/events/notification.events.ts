import { EventEmitter } from 'events';

export interface NotificationEventData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

class NotificationEventEmitter extends EventEmitter {
  emitNotification(data: NotificationEventData) {
    this.emit('notification:create', data);
  }
}

export const notificationEmitter = new NotificationEventEmitter();
