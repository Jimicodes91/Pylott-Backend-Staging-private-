export interface AddContactDto {
  name: string;
  email: string;
  phone: string;
  organization: string;
  address?: string;
  active_projects?: string;
  total_projects?: string;

  no_of_projects?: string;
  closed_projects?: string;
  assigne?: string;
}

// Add this to your shared types if not already present
export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
}
