export type CreateMetadataType = {
  name: string;
  description?: string;
};

export type UploadDocumentType = {
  document_type_id?: string;
  description: string;
  file_name: string;
  attachment: string;
  is_visible_to_client: boolean;
};
