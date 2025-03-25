export type CreateProjectType = {
  name: string;
  description?: string;
  client_id: string;
  consultant_id?: string;
  project_type_id: string;
  stage_id?: string;
  start_date: string;
  end_date: string;
  milestone_id?: string;
  status?: string;
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
