import { Response, Request } from 'express';
import { injectable, inject } from 'tsyringe';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { ContactService } from './contact.service';

@injectable()
export class ContactController {
  constructor(@inject(ContactService) private readonly contactService: ContactService) {}

  public addContact = async (req: Request, res: Response) => {
    try {
      const contact = await this.contactService.addToContact(req.body);
      return successResponse(res, 'Contact added successfully', contact, 201);
    } catch (error: any) {
      return errorResponse(res, 'ADD_CONTACT_ERROR', error.message, error.statusCode || 500);
    }
  };

  public getAllContacts = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const result = await this.contactService.getAllContacts(page, pageSize);

      return successResponse(res, 'Contacts retrieved successfully', {
        contacts: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return errorResponse(res, 'GET_CONTACTS_ERROR', error.message, error.statusCode || 500);
    }
  };
  public updateContact = async (req: Request, res: Response) => {
    try {
      const contact: any = await this.contactService.updateContact({
        id: req.params.id,
        ...req.body,
      });
      return successResponse(res, 'Contact updated successfully', contact);
    } catch (error: any) {
      return errorResponse(res, 'UPDATE_CONTACT_ERROR', error.message, error.statusCode || 500);
    }
  };

  public getContact = async (req: Request, res: Response) => {
    try {
      const contact = await this.contactService.getContactById(req.params.id);
      return successResponse(res, 'Contact retrieved successfully', contact);
    } catch (error: any) {
      return errorResponse(res, 'GET_CONTACT_ERROR', error.message, error.statusCode || 500);
    }
  };

  // In contact.controller.ts
  public searchContacts = async (req: Request, res: Response) => {
    try {
      const { query, page = 1, pageSize = 10 } = req.body;

      if (!query) {
        return errorResponse(res, 'SEARCH_CONTACTS_ERROR');
      }

      const result = await this.contactService.searchContacts(query, page, pageSize);

      return successResponse(res, 'Contacts retrieved successfully', {
        contacts: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return errorResponse(res, 'SEARCH_CONTACTS_ERROR', error.message, error.statusCode || 500);
    }
  };
}
