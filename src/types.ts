export type Status = 'pending' | 'bagging' | 'done' | 'review';

export type ExceptionType = 'missing_pages' | 'review_timeout' | 'number_gap' | 'page_abnormal';

export type ExceptionStatus = 'pending' | 'processing' | 'closed' | 'reopened';

export type ExceptionPriority = 'high' | 'medium' | 'low';

export type OperationType = 'create' | 'edit' | 'status_change' | 'assignee_change' | 'missing_pages_change' | 'exception_create' | 'exception_process' | 'exception_close' | 'exception_reopen';

export interface FlowRecord {
  id: string;
  volumeId: string;
  operationType: OperationType;
  summary: string;
  timestamp: number;
}

export interface ExceptionRecord {
  id: string;
  volumeId: string;
  type: ExceptionType;
  status: ExceptionStatus;
  priority: ExceptionPriority;
  source: string;
  description: string;
  handler: string;
  handleNote: string;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

export type QuickFilter = 'missing_unhandled' | 'recently_updated' | 'review_timeout' | 'stale_unupdated' | 'pending_exceptions' | 'closed_exceptions' | '';

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
  hasOpenException: boolean;
  exceptionCount: number;
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
  pendingExceptionCount: number;
  closedExceptionCount: number;
  processingExceptionCount: number;
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
  exception_create: '异常登记',
  exception_process: '异常处置',
  exception_close: '异常闭环',
  exception_reopen: '异常重新打开',
};

export const OPERATION_COLORS: Record<OperationType, string> = {
  create: 'bg-green-100 text-green-700',
  edit: 'bg-blue-100 text-blue-700',
  status_change: 'bg-purple-100 text-purple-700',
  assignee_change: 'bg-orange-100 text-orange-700',
  missing_pages_change: 'bg-amber-100 text-amber-700',
  exception_create: 'bg-red-100 text-red-700',
  exception_process: 'bg-yellow-100 text-yellow-700',
  exception_close: 'bg-emerald-100 text-emerald-700',
  exception_reopen: 'bg-rose-100 text-rose-700',
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  missing_pages: '缺页异常',
  review_timeout: '复核超时',
  number_gap: '编号断档',
  page_abnormal: '页数异常',
};

export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatus, string> = {
  pending: '待处理',
  processing: '处置中',
  closed: '已闭环',
  reopened: '已重新打开',
};

export const EXCEPTION_STATUS_COLORS: Record<ExceptionStatus, string> = {
  pending: 'bg-red-100 text-red-700',
  processing: 'bg-amber-100 text-amber-700',
  closed: 'bg-green-100 text-green-700',
  reopened: 'bg-rose-100 text-rose-700',
};

export const EXCEPTION_PRIORITY_LABELS: Record<ExceptionPriority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

export const EXCEPTION_PRIORITY_COLORS: Record<ExceptionPriority, string> = {
  high: 'bg-red-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white',
};
