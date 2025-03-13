import Objection from 'objection';
import dayjs from 'dayjs';

import BaseModel from '@/models/base.model';
import { dateTimeFormat } from '@/shared/constants/date.constants';

export default abstract class BaseRepository<T, M extends BaseModel> {
  protected model: Objection.ModelClass<M>;
  public tableName: string;

  constructor(model: Objection.ModelClass<M>) {
    this.model = model;
    this.tableName = model.tableName;
  }

  /**
   * @param payload - create payload
   * @param trx - db transaction
   * @returns
   */
  public async create(payload: Partial<T>, trx?: Objection.Transaction): Promise<Objection.SingleQueryBuilder<Objection.QueryBuilderType<M>>> {
    return await this.model.query(trx).insert(payload);
  }

  public async createMultiple(payloads: Partial<T>[], trx?: Objection.Transaction): Promise<Objection.SingleQueryBuilder<Objection.QueryBuilderType<M>>[]> {
    const results: Objection.SingleQueryBuilder<Objection.QueryBuilderType<M>>[] = [];

    for (const payload of payloads) {
      const result = await this.create(payload, trx);
      results.push(result);
    }

    return results;
  }

  public async getById(id: string, trx?: Objection.Transaction) {
    return await this.model.query(trx).where({ id }).whereNull('deleted_at').first();
  }

  /**
   * @param query_identifier - clause object to identify a record
   * @param trx - db transaction
   * @returns { Promise<{count: number}> }
   */
  public async count(query_identifier: Partial<T>, trx?: Objection.Transaction) {
    return this.model.query(trx).where(query_identifier).count('*', { as: 'count' }).first() as any as { count: number };
  }

  /**
   * @param query_identifier - clause object to identify a record
   * @param payload - update payload
   * @param trx - db transaction
   */
  public async update(query_identifier: Partial<T>, payload: Partial<T>, trx?: Objection.Transaction): Promise<void> {
    await this.model.query(trx).where(query_identifier).update(payload);
  }

  /**
   * @param query_identifier - clause object to identify a record
   * @param soft_delete boolean - If record should be hard deleted or soft deleted from the database
   * @param trx - db transaction
   */
  public async delete(query_identifier: Partial<T>, soft_delete: boolean = true, trx?: Objection.Transaction): Promise<void> {
    if (!soft_delete) {
      await this.model.query(trx).where(query_identifier).delete();
    } else {
      const deletedAt = dayjs().format(dateTimeFormat);

      await this.model.query(trx).where(query_identifier).update({ deleted_at: deletedAt });
    }
  }
}
