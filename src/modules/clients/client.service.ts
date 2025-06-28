import { inject, injectable } from 'tsyringe';

import { ClientRepository } from '@/repositories';
import HttpError from '@/shared/utils/errorHandler';

@injectable()
export class ClientService {
  constructor(@inject(ClientRepository) private clientRepository: ClientRepository) {}

  public async getClientDetails(clientId: string) {
    try {
      const client = await this.clientRepository.getClientWithDetails(clientId);
      if (!client) throw new HttpError('Client not found', 404);

      // Calculate project status counts
      const projects = client.projects || [];
      const statusCounts = projects.reduce(
        (acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        name: client.user?.name, // Assuming User model has 'name'
        serial_number: client.serial_number,
        plan: client.plan,
        projects: statusCounts,
      };
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch client details', 500);
    }
  }

  //get top clients based on the number of projects with the same company_id
  public async getTopClients(companyId: string) {
    try {
      const clients = await this.clientRepository.getTopClients();
      const topClients = clients.filter((client) => client.company_id === companyId);

      return topClients.map((client) => ({
        name: client.user?.name,
        serial_number: client.serial_number,
        plan: client.plan,
        projects: client.projects.length,
      }));
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch top clients', 500);
    }
  }

  public async getClientById(clientId: string) {
    try {
      const client = await this.clientRepository.getClientById(clientId);
      if (!client) throw new HttpError('Client not found', 404);

      return client;
    } catch (error: any) {
      throw new HttpError(error.message || 'Failed to fetch client', 500);
    }
  }
}
