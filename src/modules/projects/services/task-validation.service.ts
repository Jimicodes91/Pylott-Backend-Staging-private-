import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { UserRepository } from '@/repositories/user.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { ContactRespository } from '@/repositories/contact.repository';
import { TaskCategory, UserRoles } from '@/shared/enums';
import { ServiceType } from '@/shared/types/general.type';

const INTERNAL_ASSIGNEE_ROLES: string[] = [UserRoles.ADMIN, UserRoles.CONSULTANT, UserRoles.SUPER_ADMIN];

@injectable()
export class TaskValidationService {
  private traceId = '[Task Validation Service]';

  constructor(
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly contactRepository: ContactRespository,
  ) {}

  /**
   * Validate task_category is a valid enum value
   */
  validateTaskCategory(category: string): ServiceType {
    if (!Object.values(TaskCategory).includes(category as TaskCategory)) {
      return {
        status: false,
        message: `Invalid task category. Must be one of: ${Object.values(TaskCategory).join(', ')}`,
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }
    return { status: true, message: 'Valid task category' };
  }

  /**
   * Validate internal task assignees have ADMIN/CONSULTANT/SUPER_ADMIN roles
   * and belong to the same company
   */
  async validateInternalAssignees(assigneeIds: string[], companyId: string): Promise<ServiceType> {
    if (!assigneeIds || assigneeIds.length === 0) {
      return {
        status: false,
        message: 'At least one assignee is required for internal tasks',
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    for (const assigneeId of assigneeIds) {
      const user = await this.userRepository.findOne({
        id: assigneeId,
        company_id: companyId,
        deleted_at: null,
      } as any);

      if (!user) {
        return {
          status: false,
          message: `Assignee not found: ${assigneeId}`,
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (!INTERNAL_ASSIGNEE_ROLES.includes(user.role)) {
        return {
          status: false,
          message: `User "${user.name}" does not have a valid role for internal task assignment. Required: ${INTERNAL_ASSIGNEE_ROLES.join(', ')}`,
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }
    }

    return { status: true, message: 'All assignees are valid' };
  }

  /**
   * Validate external task client assignees exist in the project's
   * form_data.project_client array
   */
  async validateExternalAssignees(clientIds: string[], companyId: string, projectId: string): Promise<ServiceType> {
    if (!clientIds || clientIds.length === 0) {
      return {
        status: false,
        message: 'At least one client is required for external tasks',
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Get the project to access form_data.project_client
    const project = await this.projectRepository.findOne({
      id: projectId,
      company_id: companyId,
      deleted_at: null,
    } as any);

    if (!project) {
      return {
        status: false,
        message: 'Project not found',
        statusCode: StatusCodes.NOT_FOUND,
      };
    }

    const projectClientIds: string[] = (project as any).form_data?.project_client ?? [];

    if (!Array.isArray(projectClientIds) || projectClientIds.length === 0) {
      return {
        status: false,
        message: 'This project has no associated clients',
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Verify each client_id is in the project's client list
    for (const clientId of clientIds) {
      if (!projectClientIds.includes(clientId)) {
        return {
          status: false,
          message: `Client ${clientId} is not associated with this project`,
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      // Also verify the contact record exists and is not deleted
      const contact = await this.contactRepository.findOne({
        id: clientId,
        deleted_at: null,
      } as any);

      if (!contact) {
        return {
          status: false,
          message: `Contact not found: ${clientId}`,
          statusCode: StatusCodes.NOT_FOUND,
        };
      }
    }

    return { status: true, message: 'All client assignees are valid' };
  }

  /**
   * Validate required information items for external tasks
   */
  validateRequiredInformation(items: string[]): ServiceType {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        status: false,
        message: 'At least one required information item is needed for external tasks',
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Filter out empty/whitespace-only items
    const validItems = items.filter((item) => item && item.trim().length > 0);

    if (validItems.length === 0) {
      return {
        status: false,
        message: 'Required information items cannot be empty',
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    return { status: true, message: 'Required information is valid' };
  }
}
