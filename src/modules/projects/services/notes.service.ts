import { injectable } from 'tsyringe';

import { ProjectNotesRepository } from '@/repositories';

import { AuditTrailService } from '@/modules/audit_trail/services/audit_trail.service';

// @audit trail here
@injectable()
export class NotesService {
  private traceId = '[Notes Service]';

  constructor(
    private readonly auditTrailService: AuditTrailService,
    private readonly notesRepository: ProjectNotesRepository,
  ) {}
}
