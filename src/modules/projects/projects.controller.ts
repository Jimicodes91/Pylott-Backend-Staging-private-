import { Request, Response } from 'express';
import { injectable } from 'tsyringe';

import { UserModelType } from '@/models';
import { AddProjectMember, CreateMilestoneStagesType, CreateMilestoneType, CreateProjectType, CreateTask } from '@/shared/types/projects.type';
import { genericResponse } from '@/shared/utils/api-response';
import { MilestoneService } from './services/milestone.service';
import { NotesService } from './services/notes.service';
import { PhasesService } from './services/phases.service';
import { ProjectService } from './services/projects.service';
import { TaskService } from './services/task.service';
import { TypeService } from './services/type.service';
import { MemberService } from './services/members.service';
import { AuditTrailService } from '@/audit_trail/services/audit_trail.service';

@injectable()
export class ProjectController {
  constructor(
    private readonly taskService: TaskService,
    private readonly noteService: NotesService,
    private readonly projectService: ProjectService,
    private readonly auditTrailService: AuditTrailService,
    private readonly milestoneService: MilestoneService,
    private readonly phaseService: PhasesService,
    private readonly typeService: TypeService,
    private readonly memberService: MemberService,
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

  // Milestone endpoints
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

  getAllProjects = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { status, client_id, consultant_id, project_type_id } = req.query;

    const filters = {
      status: status as string,
      client_id: client_id as string,
      consultant_id: consultant_id as string,
      project_type_id: project_type_id as string,
    };

    const { statusCode = null, ...others } = await this.projectService.getAllProjects(company_id, filters);
    return genericResponse({ res, data: others, statusCode });
  };

  getProject = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.projectService.getProject(company_id, project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createProject = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user as UserModelType;
    const payload = req.body as CreateProjectType;

    const { statusCode = null, ...others } = await this.projectService.createProject(user, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateProject = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as Partial<CreateProjectType>;

    const { statusCode = null, ...others } = await this.projectService.updateProject(user, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  getProjectMembers = async (req: Request, res: Response) => {
    // @ts-ignore
    const company_id = (req.user as UserModelType)?.company_id;
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.memberService.getProjectMembers(company_id, project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  addProjectMember = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as AddProjectMember;

    const { statusCode = null, ...others } = await this.memberService.addProjectMember(user, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  removeProjectMember = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user as UserModelType;
    const { project_id, member_id } = req.params;

    const { statusCode = null, ...others } = await this.memberService.removeProjectMember(user, project_id, member_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createTask = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const user = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as CreateTask;

    const { statusCode = null, ...others } = await this.taskService.createTask(user, project_id, payload);
    genericResponse({ res, data: others, statusCode });
  };

  updateTask = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const user = req.user as UserModelType;
    const { task_id, project_id } = req.params;
    const payload = req.body as Partial<CreateTask>;

    const { statusCode = null, ...others } = await this.taskService.updateTask(user, task_id, project_id, payload);
    genericResponse({ res, data: others, statusCode });
  };

  getTaskById = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const { company_id } = req.user as UserModelType;
    const { project_id, task_id } = req.params;

    const { statusCode = null, ...others } = await this.taskService.getTaskById(company_id, project_id, task_id);
    genericResponse({ res, data: others, statusCode });
  };

  getAllTasks = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const { company_id } = req.user as UserModelType;
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.taskService.getAllTask(company_id, project_id);
    genericResponse({ res, data: others, statusCode });
  };

  deleteTask = async (req: Request, res: Response): Promise<void> => {
    const { project_id, task_id } = req.params;

    const { statusCode = null, ...others } = await this.taskService.deleteTask(project_id, task_id);
    genericResponse({ res, data: others, statusCode });
  };

  deleteTaskAttachment = async (req: Request, res: Response): Promise<void> => {
    // @ts-ignore
    const user = req.user as UserModelType;
    const { task_id, attachment_id } = req.params;

    const { statusCode = null, ...others } = await this.taskService.deleteTaskAttachment(user, task_id, attachment_id);
    genericResponse({ res, data: others, statusCode });
  };

  // Notes endpoints
  // (Implementation for other controller methods would go here)

  // ActivityLogs endpoints
  // (Implementation for other controller methods would go here)
}
