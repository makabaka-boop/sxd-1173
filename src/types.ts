export type Status = 'pending' | 'bagging' | 'done' | 'review';

export type OperationType = 'create' | 'edit' | 'status_change' | 'assignee_change' | 'missing_pages_change';

export interface FlowRecord {
  id: string;
  volumeId: string;
  operationType: OperationType;
  summary: string;
  timestamp: number;
}

export type QuickFilter = 'missing_unhandled' | 'recently_updated' | 'review_timeout' | 'stale_unupdated' | '';

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
  quickFilter: QuickFilter;
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
  todayNewExceptions: number;
  closedExceptions: number;
  staleVolumeCount: number;
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

export const OPERATION_LABELS: Record<OperationType, string> = {
  create: '新增分册',
  edit: '编辑信息',
  status_change: '状态变更',
  assignee_change: '责任人变更',
  missing_pages_change: '缺页说明修改',
};

export const OPERATION_COLORS: Record<OperationType, string> = {
  create: 'bg-green-100 text-green-700',
  edit: 'bg-blue-100 text-blue-700',
  status_change: 'bg-purple-100 text-purple-700',
  assignee_change: 'bg-orange-100 text-orange-700',
  missing_pages_change: 'bg-amber-100 text-amber-700',
};
