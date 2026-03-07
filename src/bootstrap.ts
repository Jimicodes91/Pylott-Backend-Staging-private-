import { container } from 'tsyringe';

import { app, validateEnvs } from './config/env';
import { dbConnect } from './database';
import { notificationEmitter } from './shared/events/notification.events';
import { NotificationService } from './modules/notifications/notification.service';

export default async function Bootstrap() {
  validateEnvs();
  dbConnect();

  // Register notification event listener
  notificationEmitter.on('notification:create', async (data) => {
    try {
      const notificationService = container.resolve(NotificationService);
      await notificationService.createNotification(data);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  });
}
