export interface ProjectAnalyticsResult {
  total: number;
  completed: number;
  in_progress: number;
  current_month_count: number;
  last_month_count: number;
}

export interface TaskStatusCounts {
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface PipelineAnalytics {
  id: string;
  name: string;
  project_count: number;
  active_project_count: number;
  completion_days: number;
}

export interface ClientAnalytics {
  client_id: string;
  client_name: string;
  company_name: string;
  project_count: number;
  active_project_count: number;
}
