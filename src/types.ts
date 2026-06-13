export type Status = 'pending' | 'bagging' | 'done' | 'review';

export interface Volume {
  id: string;
  volumeNumber: number;
  topic: string;
  pageCount: number;
  missingPages: string;
  baggingStatus: boolean;
  assignee: string;
  notes: string;
  status: Status;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Filters {
  topic: string;
  assignee: string;
  status: Status | '';
  pageMin: number | '';
  pageMax: number | '';
}

export interface CheckResult {
  type: 'gap' | 'pageConcentration' | 'topicVariance' | 'assigneeLoad';
  severity: 'warning' | 'error';
  message: string;
  details?: string[];
}

export interface TaskSummary {
  total: number;
  pending: number;
  bagging: number;
  done: number;
  review: number;
  totalPages: number;
  missingPageCount: number;
}

export const STATUS_LABELS: Record<Status, string> = {
  pending: '待补页',
  bagging: '待装袋',
  done: '已完成',
  review: '待复核',
};

export const STATUS_COLORS: Record<Status, string> = {
  pending: 'bg-status-pending text-white',
  bagging: 'bg-status-bagging text-white',
  done: 'bg-status-done text-white',
  review: 'bg-status-review text-white',
};

export const STATUS_KEYBOARD_MAP: Record<string, Status> = {
  '1': 'pending',
  '2': 'bagging',
  '3': 'done',
  '4': 'review',
};
