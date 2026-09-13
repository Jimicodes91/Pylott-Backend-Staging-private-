import { injectable } from 'tsyringe';
import { StatusCodes } from 'http-status-codes';

import { ServiceType } from '@/shared/types/general.type';
import { ProjectTaskRepository } from '@/repositories';
import { ContactRespository } from '@/repositories/contact.repository';
import { TaskClientAssigneesRepository } from '@/repositories/task_client_assignees.repository';
import { TaskClientResponsesRepository } from '@/repositories/task_client_responses.repository';
import { DocsService } from './docs.service';

// Plain type to avoid circular dependencies (mirrors DocsService usage).
interface UserType {
  id: string;
  company_id: string;
  email: string;
  name?: string;
  role: string;
}

export interface ClientResponseItem {
  required_item: string;
  file_url?: string | null; // base64 (data URL/raw) on input; stored as a hosted URL reference
  is_completed?: boolean;
  comment?: string | null;
}

export interface SubmitClientResponsePayload {
  responses: ClientResponseItem[];
}

/**
 * Client-response service (Part A / Wave 3).
 *
 * Records a client's task responses and — critically — routes any attached
 * file through the hardened document path (`DocsService.storeTaskFile`) so the
 * file is validated, stored in object storage, linked to the task, and the
 * response keeps a hosted-URL reference instead of raw base64.
 *
 * Feature: document-upload-hardening (Part A), Requirements 8, 9, 10.
 */
@injectable()
export class ClientResponseService {
  private traceId = '[Client Response Service]';

  constructor(
    private readonly projectTaskRepository: ProjectTaskRepository,
    private readonly contactRepository: ContactRespository,
    private readonly taskClientAssigneesRepository: TaskClientAssigneesRepository,
    private readonly taskClientResponsesRepository: TaskClientResponsesRepository,
    private readonly docsService: DocsService,
  ) {}

  public async submitResponse(task_id: string, user: UserType, payload: SubmitClientResponsePayload): Promise<ServiceType> {
    try {
      // Req 10.2/10.4 — only a client may submit a client response.
      const isClient = user.role?.toLowerCase() === 'client';
      if (!isClient) {
        return { status: false, message: 'Only assigned clients can submit a task response', statusCode: StatusCodes.FORBIDDEN };
      }

      if (!payload?.responses || !Array.isArray(payload.responses) || payload.responses.length === 0) {
        return { status: false, message: 'At least one response is required', statusCode: StatusCodes.BAD_REQUEST };
      }

      // Load the task to resolve project/company and to confirm it exists.
      const task = await this.projectTaskRepository.findOne({ id: task_id, company_id: user.company_id } as any);
      if (!task) {
        return { status: false, message: 'Task not found', statusCode: StatusCodes.NOT_FOUND };
      }

      // Resolve the requesting client's contact record (client_id references contacts.id).
      const contact = await this.contactRepository.findOne({ email: user.email, company_id: user.company_id } as any);
      if (!contact) {
        return { status: false, message: 'You are not authorized to respond to this task', statusCode: StatusCodes.FORBIDDEN };
      }

      // Req 10.2/10.4 — verify this client is assigned to the task.
      const assignment = await this.taskClientAssigneesRepository.findOne({ task_id, client_id: contact.id } as any);
      if (!assignment) {
        return { status: false, message: 'You are not assigned to this task', statusCode: StatusCodes.FORBIDDEN };
      }

      const project_id = (task as any).project_id as string;
      const company_id = user.company_id;
      const client_id = contact.id;

      // Process each response item: route files through the hardened document path.
      for (const item of payload.responses) {
        let storedFileUrl: string | null = item.file_url ?? null;

        const hasNewFile = typeof item.file_url === 'string' && item.file_url.length > 0 && !item.file_url.includes('http');
        if (hasNewFile) {
          // Req 8.1, 8.2, 9.1, 9.2 — validate + store the file as a linked document.
          const stored = await this.docsService.storeTaskFile({
            project_id,
            company_id,
            task_id,
            file_name: item.required_item || task.name || 'client-response',
            attachment: item.file_url as string,
            is_visible_to_client: true,
          });

          // Req 9.3 — reject the submission if a file fails validation/storage.
          if (!stored.status) {
            return { status: false, message: stored.message ?? 'File could not be stored', statusCode: StatusCodes.BAD_REQUEST };
          }

          storedFileUrl = stored.url; // Req 8.4 — reference, not base64.
        }

        await this.upsertResponse({
          task_id,
          client_id,
          required_item: item.required_item,
          file_url: storedFileUrl,
          is_completed: item.is_completed ?? true,
          comment: item.comment ?? null,
        });
      }

      return { status: true, message: 'Response submitted successfully' };
    } catch (error) {
      console.log(`${this.traceId} Error submitting client response ===> ${JSON.stringify({ task_id, err_msg: (error as Error)?.message })}`);
      return { status: false, message: 'An error occurred, please try again later' };
    }
  }

  /**
   * Upsert a single response row keyed by (task_id, client_id, required_item).
   * BaseRepository has no upsert, so find-then-update-or-create.
   */
  private async upsertResponse(row: { task_id: string; client_id: string; required_item: string; file_url: string | null; is_completed: boolean; comment: string | null }): Promise<void> {
    const existing = await this.taskClientResponsesRepository.findOne({
      task_id: row.task_id,
      client_id: row.client_id,
      required_item: row.required_item,
    } as any);

    if (existing) {
      await this.taskClientResponsesRepository.update({ id: (existing as any).id } as any, { file_url: row.file_url, is_completed: row.is_completed, comment: row.comment } as any);
    } else {
      await this.taskClientResponsesRepository.create(row as any);
    }
  }
}
