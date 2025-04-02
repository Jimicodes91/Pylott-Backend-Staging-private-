export enum RoutePrefix {
  V1 = '/api/v1',
}

export enum UserRoles {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  CONSULTANT = 'CONSULTANT',
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
}

export enum CompanySubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  DEACTIVATED = 'DEACTIVATED',
}
export enum ProjectType {
  BASIC = 'basic',
  ELITE = 'elite',
  PREMIMUM = 'premium',
}

export enum ProjectStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
}

export enum ProjectTaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  OVER_DUE = 'over_due',
}

export enum MetadataType {
  DOCUMENT = 'document',
  EVENT = 'event',
  TASK = 'task',
  NOTE = 'note',
  PROJECT = 'project',
}

export enum DocumentsDirectory {
  DOCS = 'docs',
  TASKS = 'tasks',
  NOTES = 'notes',
  PROJECTS = 'projects',
}

export enum EventStatus {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
}

export enum AUDIT_TRAIL_ACTION {
  TASK_ADDED = 'TASK_ADDED',
  NOTE_PINNED = 'NOTE_PINNED',
  NOTE_UNPINNED = 'NOTE_UNPINNED',
  NOTE_CREATED = 'NOTE_CREATED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  COMMENT_DELETED = 'COMMENT_DELETED',
}

export enum EmailSubject {
  EVENT_CREATED = 'New Event Scheduled',
  TASK_COMPLETED = 'Task Completed',
  TASK_ASSIGNED = 'New Task Assigned',
  MILESTONE_CREATED = 'New Milestone Added',
  PROJECT_CREATED = 'New Project Created',
}

export enum FieldTypeEnum {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
}
