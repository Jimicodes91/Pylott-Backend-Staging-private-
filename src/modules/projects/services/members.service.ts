import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { ProjectMembersRepository, UserRepository, ProjectRepository } from '@/repositories';
import { ObjectLiteral, ServiceType } from '@/shared/types/general.type';
import { UserModelType } from '@/models';
import { AddProjectMember } from '@/shared/types/projects.type';

@injectable()
export class MemberService {
  private traceId = '[MEMBER SERVICE]';

  constructor(
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
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

      await this.projectMembersRepository.create({
        project_id,
        user_id: payload.user_id,
        company_id,
        is_visible_to_client: payload.is_visible_to_client || false,
        added_by: user.id,
        member_type: payload?.member_type ?? null,
      });

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
}
