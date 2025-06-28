import { injectable } from 'tsyringe';

import { Contact, ContactModelType } from '@/models/contact.model';
import BaseRepository from './base.repository';
import Objection from 'objection';
import { ContactFilterOptions } from '@/modules/contact/contact.dto';

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

  public async searchContacts(query: string, companyId?: string, page: number = 1, pageSize: number = 10) {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      let queryBuilder = this.model.query().whereRaw('LOWER(name) LIKE ?', [searchTerm]).orWhereRaw('LOWER(email) LIKE ?', [searchTerm]);

      if (companyId) {
        queryBuilder = queryBuilder.where('company_id', companyId);
      }

      const results = await queryBuilder.page(page - 1, pageSize).orderBy('created_at');

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

  // In ContactRespository class

  public async getAllContacts(filter: ContactFilterOptions = {}) {
    try {
      const { companyId, page = 1, pageSize = 10, search } = filter;

      let query = this.model.query().whereNull('deleted_at');

      // Filter by company if provided
      if (companyId) {
        query = query.where('company_id', companyId);
      }

      // Apply search if provided
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        query = query.where((builder) => {
          builder.whereRaw('LOWER(name) LIKE ?', [searchTerm]).orWhereRaw('LOWER(email) LIKE ?', [searchTerm]).orWhereRaw('LOWER(phone) LIKE ?', [searchTerm]);
        });
      }

      const results = await query.page(page - 1, pageSize).orderBy('created_at', 'desc');

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

  public async getContactsByCompany(companyId: string, filter: ContactFilterOptions = {}) {
    try {
      const { page = 1, pageSize = 10, search } = filter;

      let query = this.model.query().where('company_id', companyId).whereNull('deleted_at');

      // Apply search if provided
      if (search) {
        const searchTerm = `%${search.toLowerCase()}%`;
        query = query.where((builder) => {
          builder.whereRaw('LOWER(name) LIKE ?', [searchTerm]).orWhereRaw('LOWER(email) LIKE ?', [searchTerm]).orWhereRaw('LOWER(phone) LIKE ?', [searchTerm]);
        });
      }

      const results = await query.page(page - 1, pageSize).orderBy('created_at', 'desc');

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
      console.error('Error fetching company contacts:', error);
      throw new Error('Failed to fetch company contacts');
    }
  }

  public async getClientsWhereIn(ids: string[]) {
    return this.model.query().whereIn('id', ids).whereNull('deleted_at');
  }
}
