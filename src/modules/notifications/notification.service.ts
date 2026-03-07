import { injectable } from 'tsyringe';
import NotificationRepository from '@/repositories/notification.repository';

export interface CreateNotificationDTO {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@injectable()
export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async createNotification(dto: CreateNotificationDTO) {
    return this.notificationRepository.create({
      ...dto,
      is_read: false,
    });
  }

  async getUserNotifications(userId: string, limit = 50) {
    return this.notificationRepository.findByUserId(userId, limit);
  }

  async getUnreadNotifications(userId: string) {
    return this.notificationRepository.findUnreadByUserId(userId);
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepository.getUnreadCount(userId);
  }
}
