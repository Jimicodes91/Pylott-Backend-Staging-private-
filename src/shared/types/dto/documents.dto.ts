export type CreateMetadataType = {
  name: string;
  description?: string;
  requires_expiry?: boolean;
};

export type UploadDocumentType = {
  document_type_id?: string;
  description: string;
  file_name: string;
  attachment: string;
  is_visible_to_client: boolean;
  task_id?: string;
  issue_date?: string | null;
  expiry_date?: string | null;
  does_not_expire?: boolean;
};
