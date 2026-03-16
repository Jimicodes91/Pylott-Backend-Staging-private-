import { Response } from 'express';
import { injectable } from 'tsyringe';

import { UserModelType } from '@/models/user.model';
import { AuthenticatedRequest } from '@/shared/types/express';
import { _ProjectType, AddProjectMember, CreateComment, CreateMilestoneType, CreateNote, CreateProjectType, CreateTask } from '@/shared/types/projects.type';
import { genericResponse } from '@/shared/utils/api-response';
import { MemberService } from './services/members.service';
import { MilestoneService } from './services/milestone.service';
import { NotesService } from './services/notes.service';
import { ProjectService } from './services/projects.service';
import { TaskService } from './services/task.service';
import { TypeService } from './services/type.service';
import { MetricsService } from './services/metrics.service';
import { ObjectLiteral } from '@/shared/types/general.type';

@injectable()
export class ProjectController {
  constructor(
    private readonly taskService: TaskService,
    private readonly noteService: NotesService,
    private readonly projectService: ProjectService,
    private readonly milestoneService: MilestoneService,
    private readonly typeService: TypeService,
    private readonly memberService: MemberService,
    private readonly metricsService: MetricsService,
  ) {}

  getAllProjectTypes = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = (req.user as UserModelType)?.company_id;
    const { statusCode = null, ...others } = await this.typeService.getAllProjectTypes(company_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getProjectTypeDetails = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = (req.user as UserModelType)?.company_id;
    const { project_type_id } = req.params;
    const { statusCode = null, ...others } = await this.typeService.getProjectTypeDetails(company_id, project_type_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createProjectType = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const payload = req.body as _ProjectType;
    const { statusCode = null, ...others } = await this.typeService.createProjectType(company_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateProjectTypeDetails = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const { project_type_id } = req.params;
    const payload = req.body as Partial<_ProjectType>;
    const { statusCode = null, ...others } = await this.typeService.updateProjectTypeDetails(company_id, project_type_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteProjectType = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const { project_type_id } = req.params;
    const { statusCode = null, ...others } = await this.typeService.deleteProjectType(company_id, project_type_id);
    return genericResponse({ res, data: others, statusCode });
  };

  reorderMilestones = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const { project_type_id } = req.params;
    const { milestone_ids } = req.body as { milestone_ids: string[] };
    const { statusCode = null, ...others } = await this.typeService.reorderMilestones(company_id, project_type_id, milestone_ids);
    return genericResponse({ res, data: others, statusCode });
  };

  // Milestone endpoints
  getAllMilestones = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user?.company_id;
    const { project_type_id } = req.params;
    const { statusCode = null, ...others } = await this.milestoneService.getAllMilestones(company_id, project_type_id as string);
    return genericResponse({ res, data: others, statusCode });
  };

  getMilestoneDetails = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user?.company_id;
    const { milestone_id, project_type_id } = req.params;
    const { statusCode = null, ...others } = await this.milestoneService.getMilestoneDetails(company_id, milestone_id, project_type_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createMilestone = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const payload = req.body as CreateMilestoneType;
    const { statusCode = null, ...others } = await this.milestoneService.createMilestone(company_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateMilestone = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const { milestone_id } = req.params;
    const updateData = req.body as Partial<CreateMilestoneType>;
    const { statusCode = null, ...others } = await this.milestoneService.updateMilestone(company_id, milestone_id, updateData);
    return genericResponse({ res, data: others, statusCode });
  };

  deleteMilestone = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const { milestone_id, project_type_id } = req.params;
    const { target_milestone_id } = req.body as { target_milestone_id: string };
    const { statusCode = null, ...others } = await this.milestoneService.deleteMilestone(company_id, milestone_id, project_type_id, target_milestone_id);
    return genericResponse({ res, data: others, statusCode });
  };

  getAllProjects = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user?.company_id ?? 'db5ecb64-ad18-4dd5-a872-189c79d09b7e';
    const { status, client_id, consultant_id, project_type_id, search } = req.query;

    const filters = {
      status: status as string,
      client_id: client_id as string,
      consultant_id: consultant_id as string,
      project_type_id: project_type_id as string,
      search: search as string,
    };

    const { statusCode = null, ...others } = await this.projectService.getAllProjects(company_id, filters);
    return genericResponse({ res, data: others, statusCode });
  };

  searchProjects = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const { search } = req.query as ObjectLiteral;

    const { statusCode = null, ...others } = await this.projectService.searchProject(company_id, search as string);
    return genericResponse({ res, data: others, statusCode });
  };

  getProject = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = req.user.company_id;
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.projectService.getProject(company_id, project_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createProject = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const payload = req.body as CreateProjectType;

    const { statusCode = null, ...others } = await this.projectService.createProject(user, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  updateProject = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as Partial<CreateProjectType>;
    const { statusCode = null, ...others } = await this.projectService.updateProject(user, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  getProjectMembers = async (req: AuthenticatedRequest, res: Response) => {
    const company_id = (req.user as UserModelType)?.company_id;
    const { project_id } = req.params;
    const qs = req.query;

    const { statusCode = null, ...others } = await this.memberService.getProjectMembers(company_id, project_id, qs);
    return genericResponse({ res, data: others, statusCode });
  };

  addProjectMember = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as AddProjectMember;

    const { statusCode = null, ...others } = await this.memberService.addProjectMember(user, project_id, payload);
    return genericResponse({ res, data: others, statusCode });
  };

  removeProjectMember = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as UserModelType;
    const { project_id, member_id } = req.params;

    const { statusCode = null, ...others } = await this.memberService.removeProjectMember(user, project_id, member_id);
    return genericResponse({ res, data: others, statusCode });
  };

  createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as CreateTask;

    const { statusCode = null, ...others } = await this.taskService.createTask(user, project_id, payload);
    genericResponse({ res, data: others, statusCode });
  };

  updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { task_id, project_id } = req.params;
    const payload = req.body as Partial<CreateTask>;

    const { statusCode = null, ...others } = await this.taskService.updateTask(user, task_id, project_id, payload);
    genericResponse({ res, data: others, statusCode });
  };

  getTaskById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id, task_id } = req.params;

    const { statusCode = null, ...others } = await this.taskService.getTaskById(user, user.company_id, project_id, task_id);
    genericResponse({ res, data: others, statusCode });
  };

  getAllTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { project_id = null, ...otherQueries } = req.query;
    const user = req.user as UserModelType;

    const { statusCode = null, ...others } = await this.taskService.getAllTask(user, project_id as string | null, otherQueries);
    genericResponse({ res, data: others, statusCode });
  };

  getMyAssignedTaskCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { statusCode = null, ...others } = await this.taskService.getMyAssignedIncompleteTaskCount(user);
    genericResponse({ res, data: others, statusCode });
  };

  deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { project_id, task_id } = req.params;

    const { statusCode = null, ...others } = await this.taskService.deleteTask(project_id, task_id);
    genericResponse({ res, data: others, statusCode });
  };

  deleteTaskAttachment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { task_id, attachment_id } = req.params;

    const { statusCode = null, ...others } = await this.taskService.deleteTaskAttachment(user, task_id, attachment_id);
    genericResponse({ res, data: others, statusCode });
  };

  createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id } = req.params;
    const payload = req.body as CreateNote;

    const { statusCode = null, ...others } = await this.noteService.createNote(user, project_id, payload);
    genericResponse({ res, data: others, statusCode });
  };

  toggleNotePin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id, note_id } = req.params;
    const { is_pinned } = req.body as Pick<CreateNote, 'is_pinned'>;

    const { statusCode = null, ...others } = await this.noteService.toggleNotePinStatus(user, project_id, note_id, !!is_pinned);
    genericResponse({ res, data: others, statusCode });
  };

  getAllNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id } = req.params;

    const { statusCode = null, ...others } = await this.noteService.getAllNotes(project_id, user.company_id, user.id);
    genericResponse({ res, data: others, statusCode });
  };

  getNoteDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id, note_id } = req.params;

    const { statusCode = null, ...others } = await this.noteService.getNoteDetails(project_id, user.company_id, note_id);
    genericResponse({ res, data: others, statusCode });
  };

  // Comments endpoints
  createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id, note_id } = req.params;
    const payload = req.body as CreateComment;

    const { statusCode = null, ...others } = await this.noteService.createComment(user, project_id, note_id, payload);
    genericResponse({ res, data: others, statusCode });
  };

  getNoteComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id, note_id } = req.params;

    const { statusCode = null, ...others } = await this.noteService.getNoteComments(user, project_id, note_id);
    genericResponse({ res, data: others, statusCode });
  };

  deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;
    const { project_id, note_id, comment_id } = req.params;

    const { statusCode = null, ...others } = await this.noteService.deleteComment(user, project_id, note_id, comment_id);
    genericResponse({ res, data: others, statusCode });
  };

  projectMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user as UserModelType;

    const { statusCode = null, ...others } = await this.metricsService.getDashboardMetrics(user.company_id);
    genericResponse({ res, data: others, statusCode });
  };
}
