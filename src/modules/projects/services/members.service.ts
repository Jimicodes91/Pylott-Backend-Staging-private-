import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { ProjectMembersRepository, UserRepository, ProjectRepository, UserCompanyRepository } from '@/repositories';
import { ObjectLiteral, ServiceType } from '@/shared/types/general.type';
import { UserModelType } from '@/models/user.model';
import { AddProjectMember } from '@/shared/types/projects.type';
import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';
import { AUDIT_TRAIL_ACTION, UserRoles } from '@/shared/enums';

@injectable()
export class MemberService {
  private traceId = '[MEMBER SERVICE]';

  constructor(
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly auditTrailService: AuditTrailService,
    private readonly userCompanyRepository: UserCompanyRepository,
  ) {}

  async getProjectMembers(company_id: string, project_id: string, query: ObjectLiteral = {}): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.findOne({
        id: project_id,
        company_id,
      });

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const members = await this.projectMembersRepository.getProjectMembers(project_id, company_id, query);

      return {
        status: true,
        message: 'Project members fetched successfully',
        data: members,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching project members ===> ${JSON.stringify({
          company_id,
          project_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async addProjectMember(user: UserModelType, project_id: string, payload: AddProjectMember): Promise<ServiceType> {
    try {
      const company_id = user.company_id;

      const project = await this.projectRepository.findOne({
        id: project_id,
        company_id,
      });

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const memberUser = await this.userRepository.findOne({
        id: payload.user_id,
        company_id,
      });

      if (!memberUser) {
        return {
          status: false,
          message: 'User not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const existingMember = await this.projectMembersRepository.findOne({
        project_id,
        user_id: payload.user_id,
        company_id,
      });

      if (existingMember) {
        return {
          status: false,
          message: 'User is already a member of this project',
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      const result = await this.projectMembersRepository.create({
        project_id,
        user_id: payload.user_id,
        company_id,
        is_visible_to_client: payload.is_visible_to_client || false,
        added_by: user.id,
        member_type: payload?.member_type ?? null,
      });

      const author = user?.name?.length ? user.name.replace(/^./, (c) => c.toUpperCase()) : user.id;

      this.auditTrailService.createEvent(
        AUDIT_TRAIL_ACTION.PROJECT_MEMBER_ADDED,
        {
          user_id: user.id,
          company_id,
          description: 'Project member added',
          entity_description: `${author} added ${memberUser.name} to project ${project.name}`,
          entity_id: result.id,
        },
        project_id,
      );

      return {
        status: true,
        message: 'Member added to project successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred adding project member ===> ${JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          project_id,
          member_data: payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async removeProjectMember(user: UserModelType, project_id: string, member_id: string): Promise<ServiceType> {
    try {
      const company_id = user.company_id;

      const project = await this.projectRepository.findOne({
        id: project_id,
        company_id,
      });

      if (!project) {
        return {
          status: false,
          message: 'Project not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const member = await this.projectMembersRepository.findOne({
        id: member_id,
        project_id,
        company_id,
      });

      if (!member) {
        return {
          status: false,
          message: 'Project member not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      await this.projectMembersRepository.delete({ id: member_id, project_id, company_id }, true);

      return {
        status: true,
        message: 'Member removed from project successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred removing project member ===> ${JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          project_id,
          member_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async getAvailableAssignees(company_id: string, project_id: string, category: string): Promise<ServiceType> {
    try {
      const project = await this.projectRepository.findOne({ id: project_id, company_id });
      if (!project) {
        return { status: false, message: 'Project not found', statusCode: StatusCodes.NOT_FOUND };
      }

      if (category === 'internal') {
        // Internal: all active team members in the company (super_admin, admin, consultant)
        const companyUsers = await this.userCompanyRepository.getCompanyUsers(company_id);
        const teamMembers = companyUsers
          .filter((uc: any) => uc.user && [UserRoles.SUPER_ADMIN, UserRoles.ADMIN, UserRoles.CONSULTANT].includes(uc.role || uc.user?.role))
          .map((uc: any) => ({ id: uc.user.id, name: uc.user.name, email: uc.user.email }));
        return { status: true, message: 'Available assignees fetched successfully', data: teamMembers };
      } else {
        // External: client members of this project
        const members = await this.projectMembersRepository.getProjectMembers(project_id, company_id, { member_type: 'client' });
        const clients = members.filter((m: any) => m.user).map((m: any) => ({ id: m.user.id, name: m.user.name, email: m.user.email }));
        return { status: true, message: 'Available assignees fetched successfully', data: clients };
      }
    } catch (error) {
      console.log(`${this.traceId} Error fetching available assignees ===> ${error?.message}`);
      return { status: false, message: 'An error occurred, please try again later' };
    }
  }
}
