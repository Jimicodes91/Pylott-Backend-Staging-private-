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
}
