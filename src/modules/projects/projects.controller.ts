import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { UserModelType } from '@/models';
import { CreateMilestoneType, CreateProjectType, CreateMilestoneStagesType } from '@/shared/types/projects.type';
import { genericResponse } from '@/shared/utils/api-response';
import { ActivityLogsService } from './services/activity_log.service';
import { MilestoneService } from './services/milestone.service';
import { NotesService } from './services/notes.service';
import { PhasesService } from './services/phases.service';
import { ProjectService } from './services/projects.service';
import { TaskService } from './services/task.service';
import { TypeService } from './services/type.service';

@injectable()
export class ProjectController {
  constructor(
    private readonly taskService: TaskService,
    private readonly noteService: NotesService,
    private readonly projectService: ProjectService,
    private readonly activityLogService: ActivityLogsService,
    private readonly milestoneService: MilestoneService,
    private readonly phaseService: PhasesService,
    private readonly typeService: TypeService,
  ) {}

  getAllProjectTypes = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { statusCode = null, ...others } = await this.typeService.getAllProjectTypes(company_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getProjectTypeDetails = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { project_type_id } = req.params;
    const { statusCode = null, ...others } = await this.typeService.getProjectTypeDetails(company_id, project_type_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createProjectType = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const payload = req.body as CreateProjectType;
    const { statusCode = null, ...others } = await this.typeService.createProjectType(company_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateProjectTypeDetails = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { project_type_id } = req.params;
    const payload = req.body as Partial<CreateProjectType>;
    const { statusCode = null, ...others } = await this.typeService.updateProjectTypeDetails(company_id, project_type_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  getAllMilestones = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { project_type_id } = req.params;
    const { statusCode = null, ...others } = await this.milestoneService.getAllMilestones(company_id, project_type_id as string);
    return genericResponse({ res, data: others, statusCode });
  };

  getMilestoneDetails = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { milestone_id, project_type_id } = req.params;
    const { statusCode = null, ...others } = await this.milestoneService.getMilestoneDetails(company_id, milestone_id, project_type_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createMilestone = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const payload = req.body as CreateMilestoneType;
    const { statusCode = null, ...others } = await this.milestoneService.createMilestone(company_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateMilestone = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { milestone_id } = req.params;
    const updateData = req.body as Partial<CreateMilestoneType>;
    const { statusCode = null, ...others } = await this.milestoneService.updateMilestone(company_id, milestone_id, updateData);
    return genericResponse({ res, data: others, statusCode });
  };

  getMilestoneStageDetails = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { stage_id } = req.params;

    const { statusCode = null, ...others } = await this.phaseService.getMilestoneStageDetails(company_id, stage_id);

    return genericResponse({ res, data: others, statusCode });
  };

  getMilestoneStagesByMilestone = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { milestone_id } = req.params;

    const { statusCode = null, ...others } = await this.phaseService.getMilestoneStagesByMilestone(company_id, milestone_id);

    return genericResponse({ res, data: others, statusCode });
  };

  createMilestoneStage = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const payload = req.body as CreateMilestoneStagesType;
    const is_system = req.body.is_system || false;

    const { statusCode = null, ...others } = await this.phaseService.createMilestoneStage(company_id, payload, is_system);

    return genericResponse({ res, data: others, statusCode });
  };

  updateMilestoneStage = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { stage_id } = req.params;
    const payload = req.body as Partial<CreateMilestoneStagesType>;

    const { statusCode = null, ...others } = await this.phaseService.updateMilestoneStage(company_id, stage_id, payload);

    return genericResponse({ res, data: others, statusCode });
  };

  // Task endpoints
  // (Implementation for other controller methods would go here)

  // Notes endpoints
  // (Implementation for other controller methods would go here)

  // Project endpoints
  // (Implementation for other controller methods would go here)

  // ActivityLogs endpoints
  // (Implementation for other controller methods would go here)
}
