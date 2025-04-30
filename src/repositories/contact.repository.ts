import { injectable } from 'tsyringe';

import { Contact, ContactModelType } from '@/models/contact.model';
import BaseRepository from './base.repository';

@injectable()
export class ContactRespository extends BaseRepository<ContactModelType, Contact> {
  constructor() {
    super(Contact);
  }
  public async getAllContacts() {
    try {
      // TEMPORARY: Remove all filters to debug
      const contacts = await this.model.query();

      return contacts;
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
}
