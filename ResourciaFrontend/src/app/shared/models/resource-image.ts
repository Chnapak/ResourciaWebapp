export interface ResourceImageModel {
  id: string;
  contentType: string;
  url: string;
  uploadedById?: string;
  uploadedBy?: string | null;
  uploadedByHandle?: string | null;
  uploadedAtUtc?: string | null;
}

export interface ResourceImageUploadResponse {
  id: string;
  fileName: string;
  contentType: string;
  resourceId: string;
}
