import 'reflect-metadata';
import Objection from 'objection';
import fc from 'fast-check';

import { DocsService } from '@/modules/docs/services/docs.service';
import { ProjectTaskStatus } from '@/shared/enums';

/**
 * Property-based tests for the client document-upload auto-completion logic.
 *
 * Feature: client-documents-tasks
 *   - Property 7: Auto-completion on upload (Validates: Requirements 6.1, 7.1)
 *   - Property 8: Document creation and linkage on upload
 *       (Validates: Requirements 5.2, 5.3, 6.3, 7.2)
 *
 * The service is instantiated directly with plain-object mock repositories so
 * no real database / cloud connection is exercised. Objection's transaction is
 * stubbed to synchronously run the callback with a fake transaction object.
 */

type Mocks = {
  projectRepository: any;
  metadataRepository: any;
  documentRepository: any;
  documentAttachmentRepository: any;
  projectSettingsRepository: any;
  projectTaskRepository: any;
  cloudinary: any;
};

function buildMocks(overrides: Partial<Mocks> = {}): Mocks {
  return {
    projectRepository: {
      findOne: jest.fn().mockResolvedValue({ id: 'project', company_id: 'company' }),
    },
    metadataRepository: {
      findOne: jest.fn().mockResolvedValue({ id: 'doc-type', type: 'document' }),
    },
    documentRepository: {
      create: jest.fn().mockResolvedValue(undefined),
    },
    documentAttachmentRepository: {
      create: jest.fn().mockResolvedValue(undefined),
    },
    projectSettingsRepository: {
      getOne: jest.fn().mockResolvedValue({}),
    },
    projectTaskRepository: {
      update: jest.fn().mockResolvedValue(undefined),
    },
    cloudinary: {
      upload: jest.fn().mockResolvedValue({ status: true, data: 'https://cloud/url' }),
    },
    ...overrides,
  };
}

function buildService(mocks: Mocks): DocsService {
  return new DocsService(
    mocks.projectRepository as any,
    mocks.metadataRepository as any,
    mocks.documentRepository as any,
    mocks.documentAttachmentRepository as any,
    mocks.projectSettingsRepository as any,
    mocks.projectTaskRepository as any,
    mocks.cloudinary as any,
  );
}

// Non-empty printable identifier-ish strings for ids / names.
const idArb = fc.string({ minLength: 1, maxLength: 24 }).filter((s) => s.trim().length > 0);
// An attachment that already contains 'http' avoids the cloudinary upload path.
const attachmentArb = fc.constant('https://existing/file.pdf');

let transactionSpy: jest.SpyInstance;

beforeEach(() => {
  // Run the transaction callback immediately with a fake trx object.
  transactionSpy = jest
    .spyOn(Objection.Model, 'transaction')
    .mockImplementation((async (cb: any) => cb({})) as any);
});

afterEach(() => {
  transactionSpy.mockRestore();
  jest.clearAllMocks();
});

// Feature: client-documents-tasks, Property 7: Auto-completion on upload — for any
// document_upload task, creating a document that references that task's task_id
// results in the task's status becoming "completed".
// Validates: Requirements 6.1, 7.1
describe('Property 7: Auto-completion on upload', () => {
  it('sets the referenced task status to completed for any upload referencing a task_id', async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb, // task_id
        idArb, // project_id
        idArb, // company_id
        idArb, // file_name
        attachmentArb,
        async (taskId, projectId, companyId, fileName, attachment) => {
          const mocks = buildMocks();
          const service = buildService(mocks);

          const user = {
            id: 'user-id',
            company_id: companyId,
            email: 'client@example.com',
            role: 'client',
          };

          const payload: any = {
            description: 'requested document',
            file_name: fileName,
            attachment,
            is_visible_to_client: true,
            task_id: taskId,
          };

          const result = await service.uploadDocument(projectId, user, payload);

          // The auto-completion update must have been called for this task.
          expect(mocks.projectTaskRepository.update).toHaveBeenCalledTimes(1);
          const [query, update] = mocks.projectTaskRepository.update.mock.calls[0];
          expect(query).toMatchObject({ id: taskId, company_id: companyId });
          expect(update).toEqual({ status: ProjectTaskStatus.COMPLETED });
          expect(update.status).toBe('completed');

          // And the operation reports success.
          expect(result.status).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: client-documents-tasks, Property 8: Document creation and linkage on upload
// — for any client document submission that references a task_id, the created document
// record retains that task_id, is associated with the task's project, and carries an
// is_visible_to_client value reflecting client visibility.
// Validates: Requirements 5.2, 5.3, 6.3, 7.2
describe('Property 8: Document creation and linkage on upload', () => {
  it('creates a document that retains task_id, project_id, and an is_visible_to_client value', async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb, // task_id
        idArb, // project_id
        idArb, // company_id
        idArb, // file_name
        attachmentArb,
        fc.boolean(), // requested visibility
        async (taskId, projectId, companyId, fileName, attachment, visible) => {
          const mocks = buildMocks();
          const service = buildService(mocks);

          const user = {
            id: 'user-id',
            company_id: companyId,
            email: 'client@example.com',
            role: 'client',
          };

          const payload: any = {
            description: 'requested document',
            file_name: fileName,
            attachment,
            is_visible_to_client: visible,
            task_id: taskId,
          };

          const result = await service.uploadDocument(projectId, user, payload);

          expect(mocks.documentRepository.create).toHaveBeenCalledTimes(1);
          const createdDoc = mocks.documentRepository.create.mock.calls[0][0];

          // Retains the originating task_id.
          expect(createdDoc.task_id).toBe(taskId);
          // Associated with the task's project.
          expect(createdDoc.project_id).toBe(projectId);
          // Carries a defined is_visible_to_client value; clients are always visible.
          expect(createdDoc.is_visible_to_client).toBeDefined();
          expect(typeof createdDoc.is_visible_to_client).toBe('boolean');
          expect(createdDoc.is_visible_to_client).toBe(true);

          expect(result.status).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Example test for the rollback / failure path (Requirements 6.1 / 7.1):
// if the auto-completion update fails, the upload must NOT be reported as successful.
describe('Failure path: completion update rejects', () => {
  it('returns { status: false } when the task completion update throws', async () => {
    const mocks = buildMocks({
      projectTaskRepository: {
        update: jest.fn().mockRejectedValue(new Error('completion failed')),
      },
    });
    const service = buildService(mocks);

    const user = {
      id: 'user-id',
      company_id: 'company-1',
      email: 'client@example.com',
      role: 'client',
    };

    const payload: any = {
      description: 'requested document',
      file_name: 'passport.pdf',
      attachment: 'https://existing/file.pdf',
      is_visible_to_client: true,
      task_id: 'task-1',
    };

    const result = await service.uploadDocument('project-1', user, payload);

    expect(result.status).toBe(false);
  });
});
