import { Response, Request } from 'express';
import { injectable, inject } from 'tsyringe';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { ContactService } from './contact.service';
import { ContactFilterOptions } from '@/shared/interface/contact';

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
  // In ContactController class

  public getAllContacts = async (req: Request, res: Response) => {
    try {
      const { companyId, page = 1, pageSize = 10, search } = req.query;

      const filter: ContactFilterOptions = {
        companyId: companyId as string,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        search: search as string,
      };

      const result = await this.contactService.getAllContacts(filter);

      return successResponse(res, 'Contacts retrieved successfully', {
        contacts: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return errorResponse(res, 'GET_CONTACTS_ERROR', error.message, error.statusCode || 500);
    }
  };

  public getContactsByCompany = async (req: Request, res: Response) => {
    try {
      const { page = 1, pageSize = 10, search } = req.query;

      const filter: ContactFilterOptions = {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        search: search as string,
      };

      const result = await this.contactService.getContactsByCompany(req.params.companyId, filter);

      return successResponse(res, 'Company contacts retrieved successfully', {
        contacts: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return errorResponse(res, 'GET_COMPANY_CONTACTS_ERROR', error.message, error.statusCode || 500);
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

  public searchContacts = async (req: Request, res: Response) => {
    try {
      const { q: query, companyId, page = 1, pageSize = 10 } = req.query;

      if (!query) {
        return errorResponse(res, 'SEARCH_CONTACTS_ERROR');
      }

      const result = await this.contactService.searchContacts(query.toString(), companyId?.toString(), parseInt(page.toString()), parseInt(pageSize.toString()));

      return successResponse(res, 'Contacts retrieved successfully', {
        contacts: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return errorResponse(res, 'SEARCH_CONTACTS_ERROR', error.message, error.statusCode || 500);
    }
  };
}
