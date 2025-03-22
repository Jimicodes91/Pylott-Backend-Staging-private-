import { injectable } from 'tsyringe';

import { ActivityLogsService } from './services/activity_log.service';
import { MilestoneService } from './services/milestone.service';
import { NotesService } from './services/notes.service';
import { PhasesService } from './services/phases.service';
import { ProjectService } from './services/projects.service';
import { TaskService } from './services/task.service';
import { TypeService } from './services/type.service';

// switch project
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
}
