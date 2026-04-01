// Field types
export type FormFieldType = 'text' | 'textarea' | 'dropdown' | 'checkboxes' | 'radio' | 'file_upload' | 'date' | 'number';

// Template status
export type FormTemplateStatus = 'draft' | 'published' | 'archived';

// Submission status
export type FormSubmissionStatus = 'draft' | 'submitted';

// Conditional rule operators
export type ConditionalOperator = 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty';

export interface ConditionalRule {
  source_field_id: string;
  operator: ConditionalOperator;
  value?: string | number | boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'url' | 'min_length' | 'max_length' | 'min_value' | 'max_value' | 'regex';
  params?: Record<string, any>;
  message?: string;
}

export interface FileConfig {
  accepted_types: string[];
  max_size_mb: number;
}

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  help_text?: string;
  sort_order: number;
  validation_rules: ValidationRule[];
  conditional_rule?: ConditionalRule;
  pre_fill_source?: 'name' | 'email' | 'phone' | null;
  options?: string[];
  file_config?: FileConfig;
}

export interface FieldError {
  field_id: string;
  field_label: string;
  rule_type: string;
  message: string;
}

// DTOs
export interface CreateTemplateDto {
  name: string;
  description?: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
}

export interface CreateFieldDto {
  type: FormFieldType;
  label: string;
  placeholder?: string;
  help_text?: string;
  sort_order: number;
  validation_rules?: ValidationRule[];
  conditional_rule?: ConditionalRule;
  pre_fill_source?: string;
  options?: string[];
  file_config?: FileConfig;
}

export interface UpdateFieldDto {
  label?: string;
  placeholder?: string;
  help_text?: string;
  sort_order?: number;
  validation_rules?: ValidationRule[];
  conditional_rule?: ConditionalRule;
  pre_fill_source?: string;
  options?: string[];
  file_config?: FileConfig;
}

export interface CreateSubmissionDto {
  template_id: string;
  task_id: string;
  client_id: string;
  project_id: string;
  company_id: string;
  submission_data: Record<string, any>;
  status: FormSubmissionStatus;
}

export interface UpdateSubmissionDto {
  submission_data: Record<string, any>;
}
