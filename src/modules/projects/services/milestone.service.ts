import { StatusCodes } from 'http-status-codes';
import { injectable } from 'tsyringe';

import { MilestonesRepository } from '@/repositories';

import { MilestonesModelType } from '@/models';
import { ServiceType } from '@/shared/types/general.type';
import { CreateMilestoneType } from '@/shared/types/projects.type';

@injectable()
export class MilestoneService {
  private traceId = '[MILESTONE SERVICE]';

  constructor(private readonly milestonesRepository: MilestonesRepository) {}

  async getAllMilestones(company_id: string, project_type_id: string): Promise<ServiceType> {
    try {
      const query: Partial<MilestonesModelType> = { company_id, project_type_id };

      const milestones = await this.milestonesRepository.findMany(query);

      return {
        status: true,
        message: 'Milestones fetched successfully',
        data: milestones,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching milestones ===> ${JSON.stringify({
          company_id,
          project_type_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: [],
      };
    }
  }

  async getMilestoneDetails(company_id: string, milestone_id: string, project_type_id: string): Promise<ServiceType> {
    try {
      const milestone = await this.milestonesRepository.findOne({
        company_id,
        id: milestone_id,
        project_type_id,
      });

      if (!milestone) {
        return {
          status: false,
          message: 'Milestone not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      return {
        status: true,
        message: 'Milestone details fetched successfully',
        data: milestone,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching milestone details ===> ${JSON.stringify({
          company_id,
          milestone_id,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
        data: null,
      };
    }
  }

  async createMilestone(company_id: string, payload: CreateMilestoneType, is_system: boolean = false): Promise<ServiceType> {
    try {
      const existingMilestone = await this.milestonesRepository.findOne({
        company_id,
        project_type_id: payload.project_type_id,
        name: payload.name,
      });

      if (existingMilestone) {
        return {
          status: false,
          message: 'A milestone with this name already exists for this project type',
          statusCode: StatusCodes.BAD_REQUEST,
          data: null,
        };
      }

      await this.milestonesRepository.create({
        ...payload,
        company_id,
        is_system,
      });

      return {
        status: true,
        message: 'Milestone created successfully',
        statusCode: StatusCodes.CREATED,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred creating milestone ===> ${JSON.stringify({
          company_id,
          ...payload,
          is_system,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  async updateMilestone(company_id: string, milestone_id: string, updateData: Partial<CreateMilestoneType>): Promise<ServiceType> {
    try {
      const existingMilestone = await this.milestonesRepository.findOne({
        company_id,
        id: milestone_id,
      });

      if (!existingMilestone) {
        return {
          status: false,
          message: 'Milestone not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (existingMilestone.is_system) {
        return {
          status: false,
          message: 'Cannot modify system-defined milestones',
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      if (updateData.name) {
        const nameExists = await this.milestonesRepository.findMilestoneWhereNotName(company_id, existingMilestone.project_type_id, updateData.name, milestone_id);
        if (nameExists) {
          return {
            status: false,
            message: 'A milestone with this name already exists for this product type',
            statusCode: StatusCodes.BAD_REQUEST,
            data: null,
          };
        }
      }

      await this.milestonesRepository.update({ id: milestone_id, company_id }, updateData);

      return {
        status: true,
        message: 'Milestone updated successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred updating milestone ===> ${JSON.stringify({
          company_id,
          milestone_id,
          updateData,
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
