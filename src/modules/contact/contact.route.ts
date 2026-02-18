import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { ContactController } from './contact.controller';
import { schemaValidator } from '@/shared/middlewares/validator.middleware';
import { addContactValidationRule, updateContactValidationRule } from '@/shared/validations/contact';

const contactController = container.resolve(ContactController);

export const contactRoutes = (prefix: string, server: Server) => {
  // Add new contact
  server.post(`${prefix}`, schemaValidator(addContactValidationRule), contactController.addContact);

  // Get all contacts (paginated)
  server.get(`${prefix}`, contactController.getAllContacts);

  server.get(`${prefix}/:id`, contactController.getContact);

  server.get(`${prefix}/company/:companyId`, contactController.getContactsByCompany);

  server.put(`${prefix}/:id`, schemaValidator(updateContactValidationRule), contactController.updateContact);

  server.post(`${prefix}/search`, contactController.searchContacts);
};
