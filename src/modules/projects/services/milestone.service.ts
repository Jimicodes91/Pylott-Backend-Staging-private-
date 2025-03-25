import dayjs from 'dayjs';
import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { MilestonesRepository } from '@/repositories';

import { ServiceType } from '@/shared/types/general.type';
import { CreateMilestoneType, UpdateMilestoneType } from '@/shared/types/projects.type';
import { MilestonesModelType } from '@/models';
import { ProjectStatus } from '@/shared/enums';

@injectable()
export class MilestoneService {
  private traceId = '[MILESTONE SERVICE]';

  constructor(private readonly milestonesRepository: MilestonesRepository) {}

  async getAllMilestones(company_id: string, project_type_id: string): Promise<ServiceType> {
    try {
      const milestones = await this.milestonesRepository.getAllMilestones(company_id, project_type_id);

      const milestonesWithDuration = milestones.map((milestone) => ({
        ...milestone,
        duration: this.calculateDuration(milestone.start_date, milestone.end_date),
        completed_at: milestone?.completed_at ? dayjs(milestone.completed_at, 'DD MMM YYYY') : null,
        start_date: dayjs(milestone.start_date, 'DD MMM YYYY'),
        status: milestone?.completed_at ? ProjectStatus.COMPLETED : ProjectStatus.IN_PROGRESS,
      }));

      return {
        status: true,
        message: 'Milestones fetched successfully',
        data: milestonesWithDuration,
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
      const milestone = await this.milestonesRepository.getMilestone(company_id, milestone_id, project_type_id);

      if (!milestone) {
        return {
          status: false,
          message: 'Milestone not found',
          statusCode: StatusCodes.NOT_FOUND,
        };
      }

      const milestoneWithDuration = {
        ...milestone,
        duration: this.calculateDuration(milestone.start_date, milestone.end_date),
        completed_at: milestone?.completed_at ? dayjs(milestone.completed_at).format('DD MMM YYYY') : null,
        start_date: dayjs(milestone.start_date, 'DD MMM YYYY'),
        status: milestone?.completed_at ? ProjectStatus.COMPLETED : ProjectStatus.IN_PROGRESS,
      };

      return {
        status: true,
        message: 'Milestone details fetched successfully',
        data: milestoneWithDuration,
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
        start_date: dayjs(payload.start_date).format(),
        end_date: dayjs(payload.end_date).format(),
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

  async updateMilestone(company_id: string, milestone_id: string, payload: UpdateMilestoneType): Promise<ServiceType> {
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

      const updateData: Partial<MilestonesModelType> = {};

      if (payload.start_date && payload.end_date) {
        updateData.start_date = dayjs(payload.start_date).format();
        updateData.end_date = dayjs(payload.end_date).format();
      }

      if (payload.name) {
        const nameExists = await this.milestonesRepository.findMilestoneWhereNotName(company_id, existingMilestone.project_type_id, payload.name, milestone_id);
        if (nameExists) {
          return {
            status: false,
            message: 'A milestone with this name already exists for this product type',
            statusCode: StatusCodes.BAD_REQUEST,
            data: null,
          };
        }
        updateData.name = payload.name;
      }

      if (payload.is_completed && existingMilestone.completed_at) {
        return { status: false, message: 'Milestone already completed' };
      }

      if (payload.is_completed) updateData.completed_at = new Date().toISOString();

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
          payload,
          err_msg: error?.message,
        })}`,
      );

      return {
        status: false,
        message: 'An error occurred, please try again later',
      };
    }
  }

  private calculateDuration(startDate: string, endDate: string, unit: 'day' | 'week' | 'month' = 'day'): number {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (unit === 'week') {
      return Math.ceil(end.diff(start, 'day') / 7);
    }

    return end.diff(start, unit) + (unit === 'day' ? 1 : 0);
  }

  private getDurationString(startDate: string, endDate: string): string {
    const days = this.calculateDuration(startDate, endDate);

    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''}`;

    return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''}`;
  }
}
