export interface AdminResource {
  id: string;
  title: string;
  url: string;
  createdBy: string | null;
  savesCount: number;
  reviewCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  isDeleted: boolean;
  deletedAtUtc: string | null;
}
