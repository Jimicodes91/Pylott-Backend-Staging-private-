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
  project_type_id: string;
};

export type CreateMilestoneStagesType = {
  name: string;
  milestone_id: string;
};

export type AddProjectMember = {
  user_id: string;
  is_visible_to_client?: boolean;
};
