import { inject, injectable } from 'tsyringe';

import { ContactRespository } from '@/repositories/contact.repository';
import HttpError from '@/shared/utils/errorHandler';
import { AddContactDto, ContactFilterOptions, UpdateContactDto } from './contact.dto';

@injectable()
export class ContactService {
  constructor(@inject(ContactRespository) private contactRepository: ContactRespository) {}

  private validateName(name: string) {
    if (!name || typeof name !== 'string') {
      throw new HttpError('Name is required and must be a string', 400);
    }
    // Check if name contains any numbers
    if (/\d/.test(name)) {
      throw new HttpError('Name cannot contain numbers', 400);
    }
    // Check if name contains only letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      throw new HttpError('Name can only contain letters, spaces, hyphens, and apostrophes', 400);
    }
  }

  public async addToContact(input: AddContactDto) {
    if (!input.name || !input.email || !input.phone) {
      throw new HttpError('Name, email, and phone are required', 400);
    }

    this.validateName(input.name);

    // Check if a contact with the same email already exists
    // If company_id is provided, check within that company; otherwise check globally
    const findQuery: any = {
      email: input.email.toLowerCase(),
    };

    if (input.company_id) {
      findQuery.company_id = input.company_id;
    }

    const existingContact = await this.contactRepository.findOne(findQuery);

    if (existingContact) {
      throw new HttpError('A contact with this email address already exists', 400);
    }

    // Transform assigne to assigned_to if needed
    const contactData = {
      ...input,
      email: input.email.toLowerCase(), // Normalize email to lowercase
      assigned_to: input.assigned_to || (input.assigne ? input.assigne.map((id) => ({ id, name: '' })) : []),
    };

    try {
      const contact = await this.contactRepository.create(contactData);
      return contact;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to add to contact', 500);
    }
  }

  // public async getAllContacts(page: number = 1, pageSize: number = 10) {
  //   try {
  //     if (page < 1) throw new HttpError('Page must be greater than 0', 400);
  //     if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

  //     return await this.contactRepository.getAllContacts(page, pageSize);
  //   } catch (error: any) {
  //     throw new HttpError(error.message || 'Failed to fetch contacts', error.statusCode || 500);
  //   }
  // }

  public async updateContact(input: UpdateContactDto) {
    try {
      if (!input.id) {
        throw new HttpError('Contact ID is required', 400);
      }

      // Validate name if it's being updated
      if (input.name) {
        this.validateName(input.name);
      }

      // Check if email is being updated and if it already exists
      if (input.email) {
        // Get the current contact to check its company_id if not provided in update
        const currentContact = await this.contactRepository.getContactById(input.id);
        const companyId = input.company_id || currentContact?.company_id;

        const findQuery: any = {
          email: input.email.toLowerCase(),
        };

        if (companyId) {
          findQuery.company_id = companyId;
        }

        const existingContact = await this.contactRepository.findOne(findQuery);

        // If a contact with this email exists and it's not the current contact being updated
        if (existingContact && existingContact.id !== input.id) {
          throw new HttpError('A contact with this email address already exists', 400);
        }

        // Normalize email to lowercase
        input.email = input.email.toLowerCase();
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

  // In ContactService class

  public async getAllContacts(filter: ContactFilterOptions = {}) {
    try {
      const { page = 1, pageSize = 10 } = filter;

      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.contactRepository.getAllContacts(filter);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch contacts', error.statusCode || 500);
    }
  }

  public async getContactsByCompany(companyId: string, filter: ContactFilterOptions = {}) {
    try {
      const { page = 1, pageSize = 10 } = filter;

      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.contactRepository.getContactsByCompany(companyId, filter);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch company contacts', error.statusCode || 500);
    }
  }

  public async searchContacts(query: string, companyId?: string, page: number = 1, pageSize: number = 10) {
    try {
      if (!query) throw new HttpError('Search query is required', 400);
      if (page < 1) throw new HttpError('Page must be greater than 0', 400);
      if (pageSize < 1 || pageSize > 100) throw new HttpError('Page size must be between 1 and 100', 400);

      return await this.contactRepository.searchContacts(query, companyId, page, pageSize);
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to search contacts', error.statusCode || 500);
    }
  }
}
