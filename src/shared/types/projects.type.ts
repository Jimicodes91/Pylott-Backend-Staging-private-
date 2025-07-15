import { CommentsModelType } from '@/models';
import { ProjectMemberTypeEnum, ProjectStatus } from '../enums';

export type CreateProjectType = {
  name: string;
  description?: string;
  client_id: string;
  consultant_id?: string;
  jurisdiction?: string;
  visa_required?: string;
  package?: string;
  project_type_id: string;
  start_date: string;
  end_date: string;
  milestone_id?: string;
  status?: ProjectStatus;
  milestones?: Array<CreateMilestoneType>;
};

export type CreateMilestoneType = {
  name: string;
  duration: number;
  project_type_id: string;
};

export type UpdateMilestoneType = {
  name?: string;
  duration?: number;
  is_completed?: boolean;
};

export type CreateMilestoneStagesType = {
  name: string;
  milestone_id: string;
};

export type AddProjectMember = {
  user_id: string;
  is_visible_to_client?: boolean;
  member_type?: ProjectMemberTypeEnum;
};

export type CreateTask = {
  name: string;
  description: string;
  status?: string;
  start_date: string;
  end_date: string;
  assignees: [string];
  attachments?: [string];
  is_visible_to_client: boolean;
  task_type_id: string;
  project_type_id: string;
};

export type AuditTrailPayload = {
  user_id: string;
  company_id: string;
  description: string;
  associated_entity_table?: string;
  entity_description: string;
  entity_id: string;
};

export type AuditTrailFilter = {
  start_date?: string;
  end_date?: string;
  action?: string;
};

export type PhaseProgress = {
  days_to_completion: number;
  percentage_complete: number;
};

export type ToggleProjectSettings = {
  client_can_view_task: boolean;
  client_can_view_notes: boolean;
  client_can_view_documents: boolean;
  client_can_view_activity: boolean;
  client_can_view_event: boolean;
  client_can_view_project_members: boolean;
};

export type CreateNote = {
  content: string;
  mentions?: [string];
  attachments: [string];
  is_pinned?: boolean;
};

export type MentionedUser = {
  id: string;
  name: string;
  avatar?: string;
};

export type NoteMentionMetadata = {
  mentions: string[];
};

export type EnrichedNote = {
  id: string;
  content: string;
  metadata: NoteMentionMetadata;
  parsed_mentions?: {
    user_ids: string[];
    display_names: string[];
    highlighted_content: string;
    is_mentioned_user?: boolean;
  };
};

export type CreateComment = {
  content: string;
};

export type EnrichedComment = CommentsModelType & {
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
};

export type _ProjectType = {
  company_id: string;
  name: string;
  stages?: [CreateMilestoneType];
  // custom_fields: Array<{
  //   name: string;
  //   field_key: string;
  //   field_type: FieldTypeEnum;
  //   is_required: boolean;
  //   order: number;
  //   options?: any;
  // }>;
};

export type ProcessCustomFieldsResult = {
  valid: boolean;
  message?: string;
  fields: Record<string, any>;
  documentData: Array<{ name: string; files: string[] }>;
};

export type DocumentRequestType = {
  document_type_id: string;
  assignee_id: string;
  name: string;
  description: string;
  is_visible_to_client: boolean;
  end_date: string;
};

export type AddCustomField = {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'document';
  is_required?: boolean;
  options?: string[];
};
