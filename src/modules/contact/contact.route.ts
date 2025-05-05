import { container } from 'tsyringe';

import { Server } from '@/shared/types/http.type';
import { ContactController } from './contact.controller';

const contactController = container.resolve(ContactController);

export const contactRoutes = (prefix: string, server: Server) => {
  // Add new contact
  server.post(`${prefix}`, contactController.addContact);

  // Get all contacts (paginated)
  server.get(`${prefix}`, contactController.getAllContacts);

  server.get(`${prefix}/:id`, contactController.getContact);

  server.put(`${prefix}/:id`, contactController.updateContact);

  server.post(`${prefix}/search`, contactController.searchContacts);
};
