export interface AssigneeDto {
  id: string;
  name: string;
}

export interface AddContactDto {
  name: string;
  email: string;
  phone: string;
  organization?: string;
  address?: string;
  active_projects?: string;
  total_projects?: string;
  no_of_projects?: string;
  closed_projects?: string;
  assigne?: string[]; // Old field (deprecated)
  assigned_to?: AssigneeDto[]; // New field
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateContactDto extends Partial<AddContactDto> {
  id: string;
}
