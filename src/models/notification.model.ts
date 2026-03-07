import BaseModel from './base.model';

export class Notification extends BaseModel {
  static tableName = 'notifications';

  declare id: string;
  declare user_id: string;
  declare type: string;
  declare title: string;
  declare message: string;
  declare data?: Record<string, any>;
  declare is_read: boolean;
  declare read_at?: Date;

  // No relationMappings to avoid circular dependencies
  // User relationship will be handled manually in queries if needed
}
