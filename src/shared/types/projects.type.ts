import { CommentsModelType } from '@/models';
import { FieldTypeEnum, ProjectStatus } from '../enums';

type CustomFieldValue = string | number | boolean | Date | File | string[];

export type CreateProjectType = {
  name: string;
  description?: string;
  client_id: string;
  consultant_id?: string;
  project_type_id: string;
  start_date: string;
  end_date: string;
  milestone_id?: string;
  status?: ProjectStatus;
  custom_fields?: Record<string, CustomFieldValue>;
};

export type CreateMilestoneType = {
  name: string;
  start_date: string;
  end_date: string;
  project_type_id: string;
};

export type UpdateMilestoneType = {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_completed?: boolean;
};

export type CreateMilestoneStagesType = {
  name: string;
  milestone_id: string;
};

export type AddProjectMember = {
  user_id: string;
  is_visible_to_client?: boolean;
};

export type CreateTask = {
  name: string;
  description: string;
  status?: string;
  start_date: string;
  end_date: string;
  assignee_id: string;
  attachments?: [string];
  is_visible_to_client: boolean;
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
};

export type CreateNote = {
  content: string;
  mentions?: [string];
  attachments: [string];
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
  custom_fields: Array<{
    name: string;
    field_key: string;
    field_type: FieldTypeEnum;
    is_required: boolean;
    order: number;
    options?: any;
  }>;
};

export type ProcessCustomFieldsResult = {
  valid: boolean;
  message?: string;
  fields: Record<string, any>;
  documentData: Array<{ name: string; files: string[] }>;
};
