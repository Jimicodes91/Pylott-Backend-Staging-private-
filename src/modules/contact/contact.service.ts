import { inject, injectable } from 'tsyringe';

import { ContactRespository } from '@/repositories/contact.repository';
import HttpError from '@/shared/utils/errorHandler';
import { AddContactDto } from './contact.dto';

@injectable()
export class ContactService {
  constructor(@inject(ContactRespository) private contactRepository: ContactRespository) {}

  public async addToContact(input: AddContactDto) {
    try {
      const contact = await this.contactRepository.create(input);
      return contact;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to add to contact', 500);
    }
  }
  public async getAllContacts() {
    try {
      return await this.contactRepository.getAllContacts();
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch contacts', 500);
    }
  }
}
