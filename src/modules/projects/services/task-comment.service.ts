import { StatusCodes } from 'http-status-codes';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import { TaskComment } from '@/models/task_comment.model';
import { TaskActivityLog } from '@/models/task_activity_log.model';
import { ProjectTaskRepository } from '@/repositories';
import { TaskActivityAction, UserRoles } from '@/shared/enums';
import { ServiceType } from '@/shared/types/general.type';
import { UserModelType } from '@/models/user.model';
import { notificationEmitter } from '@/shared/events/notification.events';
import { FRONTEND_URL } from '@/config/env';

@injectable()
export class TaskCommentService {
  private traceId = '[Task Comment Service]';

  constructor(private readonly projectTaskRepository: ProjectTaskRepository) {}

  async createComment(user: UserModelType, taskId: string, projectId: string, content: string): Promise<ServiceType> {
    try {
      if (!content || !content.trim()) {
        return { status: false, message: 'Comment content cannot be empty', statusCode: StatusCodes.BAD_REQUEST };
      }

      const task = await this.projectTaskRepository.getTaskById(user.company_id, projectId, taskId);
      if (!task) {
        return { status: false, message: 'Task not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const comment = await TaskComment.query().insert({
        id: uuidv4(),
        task_id: taskId,
        author_id: user.id,
        content: content.trim(),
        company_id: user.company_id,
      });

      // Log activity (non-blocking)
      try {
        await TaskActivityLog.query().insert({
          id: uuidv4(),
          task_id: taskId,
          action: TaskActivityAction.COMMENT_ADDED,
          new_value: content.trim().substring(0, 100),
          user_id: user.id,
          company_id: user.company_id,
          metadata: JSON.stringify({ comment_id: comment.id, project_id: projectId }),
        });
      } catch (e) {
        console.log(`${this.traceId} Non-blocking: failed to log comment activity`);
      }

      // Notify all task participants except the comment author
      const assignees = task.assignees || [];
      const participantIds = new Set<string>();
      if (task.author_id && task.author_id !== user.id) participantIds.add(task.author_id);
      for (const a of assignees) {
        const assigneeId = a.assignee_id || (a as any).user_id;
        if (assigneeId && assigneeId !== user.id) participantIds.add(assigneeId);
      }

      const taskLink = `${FRONTEND_URL}/projects/${projectId}/tasks/${taskId}`;
      for (const participantId of participantIds) {
        notificationEmitter.emitNotification({
          user_id: participantId,
          type: 'task_comment_added',
          title: 'New Comment on Task',
          message: `${user.name || 'Someone'} commented on task "${task.name}"`,
          data: { task_id: taskId, project_id: projectId, comment_id: comment.id, task_link: taskLink },
        });
      }

      const commentWithAuthor = await TaskComment.query().findById(comment.id).withGraphFetched('author');

      return { status: true, message: 'Comment added', data: commentWithAuthor, statusCode: StatusCodes.CREATED };
    } catch (error) {
      console.log(`${this.traceId} Error creating comment ===> ${(error as Error)?.message}`);
      return { status: false, message: 'Failed to add comment' };
    }
  }

  async getComments(companyId: string, taskId: string, projectId: string): Promise<ServiceType> {
    try {
      const task = await this.projectTaskRepository.getTaskById(companyId, projectId, taskId);
      if (!task) {
        return { status: false, message: 'Task not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const comments = await TaskComment.query().where({ task_id: taskId, company_id: companyId }).whereNull('deleted_at').withGraphFetched('author').orderBy('created_at', 'asc');

      return { status: true, message: 'Comments retrieved', data: comments };
    } catch (error) {
      console.log(`${this.traceId} Error fetching comments ===> ${(error as Error)?.message}`);
      return { status: false, message: 'Failed to fetch comments' };
    }
  }

  async deleteComment(user: UserModelType, commentId: string): Promise<ServiceType> {
    try {
      const comment = await TaskComment.query().findById(commentId).whereNull('deleted_at');
      if (!comment) {
        return { status: false, message: 'Comment not found', statusCode: StatusCodes.NOT_FOUND };
      }

      const userRole = user.role?.toLowerCase();
      if (comment.author_id !== user.id && userRole !== UserRoles.ADMIN && userRole !== UserRoles.SUPER_ADMIN) {
        return { status: false, message: 'You can only delete your own comments', statusCode: StatusCodes.FORBIDDEN };
      }

      await TaskComment.query()
        .findById(commentId)
        .patch({ deleted_at: new Date().toISOString() } as any);

      // Log activity (non-blocking)
      try {
        await TaskActivityLog.query().insert({
          id: uuidv4(),
          task_id: comment.task_id,
          action: TaskActivityAction.COMMENT_DELETED,
          previous_value: comment.content.substring(0, 100),
          user_id: user.id,
          company_id: user.company_id,
          metadata: JSON.stringify({ comment_id: commentId }),
        });
      } catch (e) {
        console.log(`${this.traceId} Non-blocking: failed to log comment deletion`);
      }

      return { status: true, message: 'Comment deleted' };
    } catch (error) {
      console.log(`${this.traceId} Error deleting comment ===> ${(error as Error)?.message}`);
      return { status: false, message: 'Failed to delete comment' };
    }
  }
}
