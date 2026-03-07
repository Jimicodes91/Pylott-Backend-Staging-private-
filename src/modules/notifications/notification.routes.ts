import { container } from 'tsyringe';
import { Server } from '@/shared/types/http.type';
import { NotificationController } from './notification.controller';
import { authenticateUser } from '@/shared/middlewares/guard.middleware';

// Lazy controller resolution to avoid circular dependencies
const getNotificationController = () => container.resolve(NotificationController);

export const notificationRoutes = (prefix: string, server: Server) => {
  server.get(`${prefix}/notifications`, authenticateUser, (req, res) => getNotificationController().getNotifications(req, res));

  server.get(`${prefix}/notifications/unread`, authenticateUser, (req, res) => getNotificationController().getUnreadNotifications(req, res));

  server.get(`${prefix}/notifications/unread/count`, authenticateUser, (req, res) => getNotificationController().getUnreadCount(req, res));

  server.patch(`${prefix}/notifications/:id/read`, authenticateUser, (req, res) => getNotificationController().markAsRead(req, res));

  server.patch(`${prefix}/notifications/read-all`, authenticateUser, (req, res) => getNotificationController().markAllAsRead(req, res));
};
