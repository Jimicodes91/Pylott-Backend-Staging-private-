import { injectable } from 'tsyringe';
import { Notification } from '@/models/notification.model';
import BaseRepository from './base.repository';

interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: Date;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

@injectable()
export default class NotificationRepository extends BaseRepository<NotificationData, Notification> {
  constructor() {
    super(Notification);
  }

  async findByUserId(userId: string, limit = 50) {
    return this.query().where('user_id', userId).orderBy('created_at', 'desc').limit(limit);
  }

  async findUnreadByUserId(userId: string) {
    return this.query().where('user_id', userId).where('is_read', false).orderBy('created_at', 'desc');
  }

  async markAsRead(notificationId: string, userId: string, trx?: any) {
    return this.update({ id: notificationId, user_id: userId } as Partial<NotificationData>, { is_read: true, read_at: new Date() } as Partial<NotificationData>, trx);
  }

  async markAllAsRead(userId: string, trx?: any) {
    return this.query(trx).where('user_id', userId).where('is_read', false).patch({ is_read: true, read_at: new Date() });
  }

  async getUnreadCount(userId: string) {
    const result = (await this.query().where('user_id', userId).where('is_read', false).count('* as count').first()) as any;
    return result?.count || 0;
  }
}
