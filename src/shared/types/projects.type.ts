export type CreateProjectType = {
  name: string;
};

export type CreateMilestoneType = {
  name: string;
  project_type_id: string;
};

export type CreateMilestoneStagesType = {
  name: string;
  milestone_id: string;
};
