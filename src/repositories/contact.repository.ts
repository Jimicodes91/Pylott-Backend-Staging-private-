import { injectable } from 'tsyringe';

import { Contact, ContactModelType } from '@/models/contact.model';
import BaseRepository from './base.repository';
import Objection from 'objection';

@injectable()
export class ContactRespository extends BaseRepository<ContactModelType, Contact> {
  constructor() {
    super(Contact);
  }

  // public async getAllContacts() {
  //   try {
  //     const contacts = await this.model.query();

  //     return contacts;
  //   } catch (error) {
  //     console.error('Error fetching contacts:', error);
  //     throw new Error('Failed to fetch contacts');
  //   }
  // }
  public async getAllContacts(page: number = 1, pageSize: number = 10) {
    try {
      const results = await this.model
        .query()
        .page(page - 1, pageSize) // Objection.js uses 0-based page index
        .orderBy('created_at');

      return {
        data: results.results,
        pagination: {
          total: results.total,
          page,
          pageSize,
          totalPages: Math.ceil(results.total / pageSize),
          hasNextPage: page * pageSize < results.total,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw new Error('Failed to fetch contacts');
    }
  }

  public async updateAssignee(contactId: string, assigne: string[]) {
    try {
      await this.model.query().findById(contactId).patch({ assigne });
    } catch (error) {
      console.error('Error updating assignee:', error);
      throw new Error('Failed to update assignee');
    }
  }

  public async getContactById(id: string, trx?: Objection.Transaction) {
    return await this.model.query(trx).where({ id }).first().skipUndefined();
  }

  // In contact.repository.ts
  public async searchContacts(query: string, page: number = 1, pageSize: number = 10) {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;

      const results = await this.model
        .query()
        .whereRaw('LOWER(name) LIKE ?', [searchTerm])
        .orWhereRaw('LOWER(email) LIKE ?', [searchTerm])
        .orWhereRaw('LOWER(organization) LIKE ?', [searchTerm])
        .page(page - 1, pageSize)
        .orderBy('created_at');

      return {
        data: results.results,
        pagination: {
          total: results.total,
          page,
          pageSize,
          totalPages: Math.ceil(results.total / pageSize),
          hasNextPage: page * pageSize < results.total,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw new Error('Failed to search contacts');
    }
  }
}
