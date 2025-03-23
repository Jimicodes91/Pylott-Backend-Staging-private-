import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { MilestonesRepository, MilestoneStagesRepository } from '@/repositories';

import { ServiceType } from '@/shared/types/general.type';
import { CreateMilestoneStagesType } from '@/shared/types/projects.type';

@injectable()
export class PhasesService {
  private traceId = '[PHASES SERVICE]';

  constructor(
    private readonly mileStoneStagesRepository: MilestoneStagesRepository,
    private readonly milestonesRepository: MilestonesRepository,
  ) {}

  async getMilestoneStageDetails(company_id: string, stage_id: string): Promise<ServiceType> {
    try {
      const stage = await this.mileStoneStagesRepository.findOne({
        company_id,
        id: stage_id,
      });

      if (!stage) {
        return {
          status: false,
          message: 'Milestone stage not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      return {
        status: true,
        message: 'Milestone stage details fetched successfully',
        data: stage,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching milestone stage details ===> ${JSON.stringify({
          company_id,
          stage_id,
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

  async getMilestoneStagesByMilestone(company_id: string, milestone_id: string): Promise<ServiceType> {
    try {
      const milestone = await this.milestonesRepository.findOne({
        id: milestone_id,
        company_id,
      });

      if (!milestone) {
        return {
          status: false,
          message: 'Milestone not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const stages = await this.mileStoneStagesRepository.findMany({
        milestone_id,
        company_id,
      });

      return {
        status: true,
        message: 'Milestone stages fetched successfully',
        data: stages,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred fetching milestone stages ===> ${JSON.stringify({
          company_id,
          milestone_id,
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

  async createMilestoneStage(company_id: string, payload: CreateMilestoneStagesType, is_system: boolean = false): Promise<ServiceType> {
    try {
      const milestone = await this.milestonesRepository.findOne({
        company_id,
        id: payload.milestone_id,
      });

      if (!milestone) {
        return {
          status: false,
          message: 'Milestone not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const existingStage = await this.mileStoneStagesRepository.findOne({
        company_id,
        milestone_id: payload.milestone_id,
        name: payload.name,
      });

      if (existingStage) {
        return {
          status: false,
          message: 'A stage with this name already exists for this milestone',
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      const newStage = await this.mileStoneStagesRepository.create({
        ...payload,
        company_id,
        is_system,
      });

      return {
        status: true,
        message: 'Milestone stage created successfully',
        statusCode: StatusCodes.CREATED,
        data: newStage,
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred creating milestone stage ===> ${JSON.stringify({
          ...payload,
          company_id,
          name,
          is_system,
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

  async updateMilestoneStage(company_id: string, stage_id: string, payload: Partial<CreateMilestoneStagesType>): Promise<ServiceType> {
    try {
      const existingStage = await this.mileStoneStagesRepository.findOne({
        company_id,
        id: stage_id,
      });

      if (!existingStage) {
        return {
          status: false,
          message: 'Milestone stage not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      if (existingStage.is_system) {
        return {
          status: false,
          message: 'Cannot modify system-defined milestone stages',
          statusCode: StatusCodes.BAD_REQUEST,
        };
      }

      if (payload.name) {
        const nameExists = await this.mileStoneStagesRepository.findMilestoneStageWhereNotName(company_id, existingStage.milestone_id, payload.name, stage_id);

        if (nameExists) {
          return {
            status: false,
            message: 'A stage with this name already exists for this milestone',
            statusCode: StatusCodes.BAD_REQUEST,
          };
        }
      }

      if (payload.milestone_id) {
        const milestone = await this.milestonesRepository.findOne({
          company_id,
          id: payload.milestone_id,
        });

        if (!milestone) {
          return {
            status: false,
            message: 'Milestone not found',
            statusCode: StatusCodes.NOT_FOUND,
          };
        }
      }

      await this.mileStoneStagesRepository.update({ id: stage_id, company_id }, payload);

      return {
        status: true,
        message: 'Milestone stage updated successfully',
      };
    } catch (error) {
      console.log(
        `${this.traceId} Error occurred updating milestone stage ===> ${JSON.stringify({
          company_id,
          stage_id,
          payload,
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
}
