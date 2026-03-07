import dayjs from 'dayjs';
import Knex from 'knex';
import { v4 as uuidv4 } from 'uuid';
import Objection from 'objection';
import path from 'path';

import knexConfig from '../../knexfile';
import { dateTimeFormat } from '@/shared/constants/date.constants';

// Commented out to avoid early model initialization - knex is set in database/index.ts
// Objection.Model.knex(Knex(knexConfig));

export default abstract class BaseModel extends Objection.Model {
  id: string;

  created_at: string;

  updated_at: string;

  deleted_at: string | null;

  static get idColumn() {
    return ['id'];
  }

  // Helper method to resolve model paths for circular dependencies
  static modelPath(modelFileName: string): string {
    return path.join(__dirname, modelFileName);
  }

  $beforeInsert(): void | Promise<any> {
    if (!this.id) {
      this.id = uuidv4();
    }

    if (!this.created_at) this.created_at = dayjs().format(dateTimeFormat);

    if (!this.updated_at) this.updated_at = dayjs().format(dateTimeFormat);
  }

  $beforeUpdate(): void | Promise<any> {
    if (!this.updated_at) this.updated_at = dayjs().format(dateTimeFormat);
  }
}
