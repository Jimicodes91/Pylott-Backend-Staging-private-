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
}
