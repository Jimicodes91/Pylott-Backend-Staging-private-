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
  DUE = 'due',
  ON_TRACK = 'on_track',
  LATE = 'late',
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
  FORM_FIELD = 'form_field',
}

export enum DocumentsDirectory {
  DOCS = 'docs',
  TASKS = 'tasks',
  NOTES = 'notes',
  PROJECTS = 'projects',
  FORM_FIELD = 'form-field',
  PAYMENT_PROOF = 'payment_proof',
  PROFILE_PICTURES = 'profile_pictures',
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
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  PROJECT_MEMBER_ADDED = 'PROJECT_MEMBER_ADDED',
  // Auth actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_SIGNUP = 'USER_SIGNUP',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_PASSWORD_UPDATE = 'USER_PASSWORD_UPDATE',
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
  USER_INVITATION_SENT = 'USER_INVITATION_SENT',
  USER_REGISTRATION_COMPLETED = 'USER_REGISTRATION_COMPLETED',
  // Admin actions
  ADMIN_USER_STATUS_UPDATED = 'ADMIN_USER_STATUS_UPDATED',
  ADMIN_COMPANY_STATUS_UPDATED = 'ADMIN_COMPANY_STATUS_UPDATED',
  ADMIN_COMPANY_SUBSCRIPTION_UPDATED = 'ADMIN_COMPANY_SUBSCRIPTION_UPDATED',
  ADMIN_SYS_ADMIN_ADDED = 'ADMIN_SYS_ADMIN_ADDED',
  ADMIN_SYS_ADMIN_DEACTIVATED = 'ADMIN_SYS_ADMIN_DEACTIVATED',
  // Client actions
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  CLIENT_DELETED = 'CLIENT_DELETED',
  // Company actions
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  COMPANY_SUBSCRIPTION_UPDATED = 'COMPANY_SUBSCRIPTION_UPDATED',
  // Organization Finance actions
  ORG_FINANCE_CREATED = 'ORG_FINANCE_CREATED',
  ORG_FINANCE_UPDATED = 'ORG_FINANCE_UPDATED',
  ORG_FINANCE_MARKED_PAID = 'ORG_FINANCE_MARKED_PAID',
  // User actions
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  USER_ADDED_TO_COMPANY = 'USER_ADDED_TO_COMPANY',
  USER_REMOVED_FROM_COMPANY = 'USER_REMOVED_FROM_COMPANY',
}

export enum EmailSubject {
  EVENT_CREATED = 'New Event Scheduled',
  TASK_COMPLETED = 'Task Completed',
  TASK_ASSIGNED = 'New Task Assigned',
  MILESTONE_CREATED = 'New Milestone Added',
  PROJECT_CREATED = 'New Project Created',
  DOCUMENT_REQUEST = 'Document Request',
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

export enum QueueNames {
  MILESTONE_TRACKING = 'milestone-tracking',
}

export enum ProjectMemberTypeEnum {
  INTERNAL = 'internal',
  CLIENT = 'client',
}

export enum RedisPrefixKeyEnum {
  PROJECT_CLIENT_INVITATION = 'PROJECT_CLIENT_INVITATION',
}
