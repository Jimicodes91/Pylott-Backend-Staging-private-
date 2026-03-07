import { Response } from 'express';
import { injectable } from 'tsyringe';
import { NotificationService } from './notification.service';
import { successResponse } from '@/shared/utils/api-response';
import { StatusCodes } from 'http-status-codes';
import { AuthenticatedRequest } from '@/shared/types/express';

@injectable()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getNotifications(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const notifications = await this.notificationService.getUserNotifications(userId, limit);
    return successResponse(res, 'Notifications retrieved successfully', notifications);
  }

  async getUnreadNotifications(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    const notifications = await this.notificationService.getUnreadNotifications(userId);
    return successResponse(res, 'Unread notifications retrieved successfully', notifications);
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    const count = await this.notificationService.getUnreadCount(userId);
    return successResponse(res, 'Unread count retrieved successfully', { count });
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { id } = req.params;

    await this.notificationService.markAsRead(id, userId);
    return successResponse(res, 'Notification marked as read', null, StatusCodes.OK);
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;

    await this.notificationService.markAllAsRead(userId);
    return successResponse(res, 'All notifications marked as read', null, StatusCodes.OK);
  }
}
