import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { ActivityLogsService } from './services/activity_log.service';
import { MilestoneService } from './services/milestone.service';
import { NotesService } from './services/notes.service';
import { PhasesService } from './services/phases.service';
import { ProjectService } from './services/projects.service';
import { TaskService } from './services/task.service';
import { TypeService } from './services/type.service';
import { genericResponse } from '@/shared/utils/api-response';
import { UserModelType } from '@/models';
import { CreateProjectType } from '@/shared/types/projects.type';

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

  // Task endpoints
  // (Implementation for other controller methods would go here)

  // Notes endpoints
  // (Implementation for other controller methods would go here)

  // Project endpoints
  // (Implementation for other controller methods would go here)

  // ActivityLogs endpoints
  // (Implementation for other controller methods would go here)

  // Milestone endpoints
  // (Implementation for other controller methods would go here)

  // Phase endpoints
  // (Implementation for other controller methods would go here)
}
