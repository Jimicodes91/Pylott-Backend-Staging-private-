import { inject, injectable } from 'tsyringe';

import { ContactRespository } from '@/repositories/contact.repository';
import HttpError from '@/shared/utils/errorHandler';
import { AddContactDto, UpdateContactDto } from './contact.dto';

@injectable()
export class ContactService {
  constructor(@inject(ContactRespository) private contactRepository: ContactRespository) {}

  // public async addToContact(input: AddContactDto) {
  //   if (!input.name || !input.email || !input.phone || !input.assigne) {
  //     throw new HttpError('Name, email, phone, and assignee are required', 400);
  //   }
  //   try {
  //     const contact = await this.contactRepository.create(input);
  //     return contact;
  //   } catch (error: any) {
  //     throw new HttpError(error.message || 'Failed to add to contact', 500);
  //   }
  // }

  public async addToContact(input: AddContactDto) {
    if (!input.name || !input.email || !input.phone) {
      throw new HttpError('Name, email, and phone are required', 400);
    }

    // Transform assigne to assigned_to if needed
    const contactData = {
      ...input,
      assigned_to: input.assigned_to || (input.assigne ? input.assigne.map((id) => ({ id, name: '' })) : []),
    };

    try {
      const contact = await this.contactRepository.create(contactData);
      return contact;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to add to contact', 500);
    }
  }
  // public async getAllContacts() {
  //   try {
  //     return await this.contactRepository.getAllContacts();
  //   } catch (error: any) {
  //     throw new HttpError(error.message || 'Failed to fetch contacts', 500);
  //   }
  // }
  public async getAllContacts(page: number = 1, pageSize: number = 10) {
    try {
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.contactRepository.getAllContacts(page, pageSize);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch contacts', error.statusCode || 500);
    }
  }
  public async updateContact(input: UpdateContactDto) {
    try {
      if (!input.id) {
        throw new HttpError('Contact ID is required', 400);
      }

      const { id, ...updateData } = input;
      const updatedContact = await this.contactRepository.update({ id }, updateData);
      return updatedContact;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to update contact', error.statusCode || 500);
    }
  }

  public async getContactById(id: string) {
    try {
      const contact = await this.contactRepository.getContactById(id);
      if (!contact) {
        throw new HttpError('Contact not found', 404);
      }
      return contact;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch contact', error.statusCode || 500);
    }
  }

  // In contact.service.ts (keep the same method)
  public async searchContacts(query: string, page: number = 1, pageSize: number = 10) {
    try {
      if (!query) throw new HttpError('Search query is required', 400);
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.contactRepository.searchContacts(query, page, pageSize);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to search contacts', error.statusCode || 500);
    }
  }
}
