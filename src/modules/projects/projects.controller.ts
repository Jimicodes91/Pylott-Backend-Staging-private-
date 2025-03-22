import { injectable } from 'tsyringe';

import { ActivityLogsService } from './services/activity_log.service';
import { NotesService } from './services/notes.service';
import { ProjectService } from './services/projects.service';
import { TaskService } from './services/task.service';

// switch project
@injectable()
export class ProjectController {
  constructor(
    private readonly taskService: TaskService,
    private readonly noteService: NotesService,
    private readonly projectService: ProjectService,
    private readonly activityLogService: ActivityLogsService,
  ) {}
}
