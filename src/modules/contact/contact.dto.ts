export interface AssigneeDto {
  id: string;
  name: string;
}

export type ContactStatus = 'Uninvited' | 'Invited' | 'Active';

export interface AddContactDto {
  name: string;
  email: string;
  phone: string;
  status?: ContactStatus;
  organization?: string;
  address?: string;
  active_projects?: string;
  company_id?: string;
  total_projects?: string;
  no_of_projects?: string;
  closed_projects?: string;
  assigne?: string[]; // Old field (deprecated)
  assigned_to?: AssigneeDto[]; // New field
  /** Set by backend from authenticated user (who added the contact). */
  added_by_user_id?: string | null;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateContactDto extends Partial<AddContactDto> {
  id: string;
}

export interface ContactFilterOptions {
  companyId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}
