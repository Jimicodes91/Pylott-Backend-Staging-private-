// invite client
// create client
// add to project
// client view

import { Response, Request } from 'express';
import { injectable } from 'tsyringe';
import { errorResponse, successResponse } from '@/shared/utils/api-response';
import { ClientService } from './client.service';

@injectable()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  public getClientDetails = async (req: Request, res: Response) => {
    try {
      const clientId = req.params.id;
      if (!clientId) return errorResponse(res, 'Client ID required');

      const details = await this.clientService.getClientDetails(clientId);
      return successResponse(res, 'Client details retrieved', details);
    } catch (error: any) {
      return errorResponse(res, 'CLIENT_DETAILS_ERROR', error.message, 500);
    }
  };
  public getTopClients = async (req: Request, res: Response) => {
    try {
      const companyId = req.params.companyId;
      if (!companyId) return errorResponse(res, 'Company ID required');

      const clients = await this.clientService.getTopClients(companyId);
      return successResponse(res, 'Top clients retrieved', clients);
    } catch (error: any) {
      return errorResponse(res, 'TOP_CLIENTS_ERROR', error.message, 500);
    }
  };
  public getClientById = async (req: Request, res: Response) => {
    try {
      const clientId = req.params.id;
      if (!clientId) return errorResponse(res, 'Client ID required');

      const client = await this.clientService.getClientById(clientId);
      return successResponse(res, 'Client retrieved', client);
    } catch (error: any) {
      return errorResponse(res, 'CLIENT_DETAILS_ERROR', error.message, 500);
    }
  };
}
