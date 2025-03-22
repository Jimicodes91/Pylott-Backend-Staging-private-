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
}

export enum DocumentsDirectory {
  DOCS = 'docs',
}
