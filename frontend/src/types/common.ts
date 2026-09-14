export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortState {
  field: string;
  order: SortOrder;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

export interface StudentFilterParams {
  searchQuery?: string;
  department?: string;
  admissionCategory?: string;
  program?: string;
  batch?: string;
  archiveReason?: string;
}
