import { Volume, CheckResult, TaskSummary, Filters, FlowRecord, OperationType, QuickFilter, ExceptionRecord } from '../types';

export const checkGaps = (volumes: Volume[]): CheckResult[] => {
  if (volumes.length < 2) return [];

  const sorted = [...volumes].sort((a, b) => a.volumeNumber - b.volumeNumber);
  const results: CheckResult[] = [];
  const gaps: string[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i].volumeNumber;
    const next = sorted[i + 1].volumeNumber;
    if (next - current > 1) {
      for (let n = current + 1; n < next; n++) {
        gaps.push(`第 ${n} 册`);
      }
    }
  }

  if (gaps.length > 0) {
    results.push({
      type: 'gap',
      severity: 'error',
      message: `检测到 ${gaps.length} 处编号断档`,
      details: gaps,
    });
  }

  return results;
};

export const checkPageConcentration = (volumes: Volume[]): CheckResult[] => {
  if (volumes.length < 5) return [];

  const pageCounts = volumes.map(v => v.pageCount);
  const avg = pageCounts.reduce((a, b) => a + b, 0) / pageCounts.length;
  const std = Math.sqrt(pageCounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / pageCounts.length);

  const outliers = volumes
    .filter(v => Math.abs(v.pageCount - avg) > 2 * std)
    .map(v => `第 ${v.volumeNumber} 册 (${v.pageCount}页)`);

  if (outliers.length > 0) {
    return [{
      type: 'pageConcentration',
      severity: 'warning',
      message: `检测到 ${outliers.length} 册页数异常偏离均值 (均值: ${Math.round(avg)}页)`,
      details: outliers,
    }];
  }

  return [];
};

export const checkTopicVariance = (volumes: Volume[]): CheckResult[] => {
  const results: CheckResult[] = [];

  const topicGroups = new Map<string, Volume[]>();
  volumes.forEach(v => {
    const group = topicGroups.get(v.topic) || [];
    group.push(v);
    topicGroups.set(v.topic, group);
  });

  topicGroups.forEach((group, topic) => {
    if (group.length < 2) return;

    const pageCounts = group.map(v => v.pageCount);
    const max = Math.max(...pageCounts);
    const min = Math.min(...pageCounts);
    const ratio = max / min;

    if (ratio > 2) {
      results.push({
        type: 'topicVariance',
        severity: 'warning',
        message: `「${topic}」主题内页数差异过大 (${min}-${max}页, 差异${(ratio * 100 - 100).toFixed(0)}%)`,
        details: group.map(v => `第 ${v.volumeNumber} 册 (${v.pageCount}页)`),
      });
    }
  });

  return results;
};

export const checkAssigneeLoad = (volumes: Volume[]): CheckResult[] => {
  const results: CheckResult[] = [];

  const assigneeGroups = new Map<string, Volume[]>();
  volumes.forEach(v => {
    if (v.status !== 'done') {
      const group = assigneeGroups.get(v.assignee) || [];
      group.push(v);
      assigneeGroups.set(v.assignee, group);
    }
  });

  if (assigneeGroups.size < 2) return results;

  const loads = Array.from(assigneeGroups.entries()).map(([name, items]) => ({
    name,
    count: items.length,
    pages: items.reduce((sum, v) => sum + v.pageCount, 0),
  }));

  const maxPages = Math.max(...loads.map(l => l.pages));
  const avgPages = loads.reduce((sum, l) => sum + l.pages, 0) / loads.length;

  if (maxPages > avgPages * 1.5) {
    const overloaded = loads
      .filter(l => l.pages > avgPages * 1.5)
      .map(l => `${l.name} (${l.pages}页, ${l.count}册)`);

    results.push({
      type: 'assigneeLoad',
      severity: 'warning',
      message: `责任人负载不均 (人均 ${Math.round(avgPages)}页)`,
      details: overloaded,
    });
  }

  return results;
};

export const runAllChecks = (volumes: Volume[]): CheckResult[] => {
  return [
    ...checkGaps(volumes),
    ...checkPageConcentration(volumes),
    ...checkTopicVariance(volumes),
    ...checkAssigneeLoad(volumes),
  ];
};

export const getTaskSummary = (volumes: Volume[], flowRecords: FlowRecord[], exceptions: ExceptionRecord[]): TaskSummary => {
  const now = Date.now();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  const summary: TaskSummary = {
    total: volumes.length,
    pending: 0,
    bagging: 0,
    done: 0,
    review: 0,
    totalPages: 0,
    missingPageCount: 0,
    todayNewExceptions: 0,
    closedExceptions: 0,
    staleVolumeCount: 0,
    pendingExceptionCount: 0,
    closedExceptionCount: 0,
    processingExceptionCount: 0,
  };

  volumes.forEach(v => {
    summary[v.status]++;
    summary.totalPages += v.pageCount;
    if (v.missingPages && v.missingPages.trim()) {
      summary.missingPageCount++;
    }
  });

  const todayNewRecords = flowRecords.filter(r =>
    r.operationType === 'missing_pages_change' &&
    r.timestamp >= todayStart &&
    r.summary !== '缺页说明已清除'
  );
  const todayNewVolumeIds = new Set(todayNewRecords.map(r => r.volumeId));
  volumes.forEach(v => {
    if (v.createdAt >= todayStart && v.missingPages && v.missingPages.trim()) {
      todayNewVolumeIds.add(v.id);
    }
  });
  summary.todayNewExceptions = todayNewVolumeIds.size;

  const exceptionVolumeIds = new Set(
    flowRecords
      .filter(r => r.operationType === 'missing_pages_change')
      .map(r => r.volumeId)
  );
  summary.closedExceptions = volumes.filter(v =>
    v.status === 'done' &&
    !(v.missingPages && v.missingPages.trim()) &&
    exceptionVolumeIds.has(v.id)
  ).length;

  volumes.forEach(v => {
    if (v.status !== 'done' && v.updatedAt < twentyFourHoursAgo) {
      summary.staleVolumeCount++;
    }
  });

  exceptions.forEach(e => {
    if (e.status === 'pending') summary.pendingExceptionCount++;
    if (e.status === 'processing') summary.processingExceptionCount++;
    if (e.status === 'closed') summary.closedExceptionCount++;
  });

  return summary;
};

export const createFlowRecord = (
  volumeId: string,
  operationType: OperationType,
  summary: string
): Omit<FlowRecord, 'id'> => {
  return {
    volumeId,
    operationType,
    summary,
    timestamp: Date.now(),
  };
};

export const generateChangeSummary = (
  oldVolume: Volume | null,
  newVolume: Volume
): { operationType: OperationType; summary: string }[] => {
  const changes: { operationType: OperationType; summary: string }[] = [];

  if (!oldVolume) {
    changes.push({
      operationType: 'create',
      summary: `新增第 ${newVolume.volumeNumber} 册，主题: ${newVolume.topic}，责任人: ${newVolume.assignee}`,
    });
    return changes;
  }

  if (oldVolume.status !== newVolume.status) {
    const oldLabel = { pending: '待补页', bagging: '待装袋', done: '已完成', review: '待复核' }[oldVolume.status];
    const newLabel = { pending: '待补页', bagging: '待装袋', done: '已完成', review: '待复核' }[newVolume.status];
    changes.push({
      operationType: 'status_change',
      summary: `状态从「${oldLabel}」变更为「${newLabel}」`,
    });
  }

  if (oldVolume.assignee !== newVolume.assignee) {
    changes.push({
      operationType: 'assignee_change',
      summary: `责任人从「${oldVolume.assignee}」变更为「${newVolume.assignee}」`,
    });
  }

  if (oldVolume.missingPages !== newVolume.missingPages) {
    changes.push({
      operationType: 'missing_pages_change',
      summary: newVolume.missingPages.trim()
        ? `缺页说明更新为「${newVolume.missingPages}」`
        : '缺页说明已清除',
    });
  }

  const hasOtherChanges =
    oldVolume.volumeNumber !== newVolume.volumeNumber ||
    oldVolume.topic !== newVolume.topic ||
    oldVolume.pageCount !== newVolume.pageCount ||
    oldVolume.baggingStatus !== newVolume.baggingStatus ||
    oldVolume.notes !== newVolume.notes;

  if (hasOtherChanges && changes.length === 0) {
    changes.push({
      operationType: 'edit',
      summary: `编辑了第 ${newVolume.volumeNumber} 册的基本信息`,
    });
  } else if (hasOtherChanges) {
    changes.push({
      operationType: 'edit',
      summary: `同时修改了其他字段信息`,
    });
  }

  return changes;
};

export const isQuickFilterMatch = (volume: Volume, quickFilter: QuickFilter): boolean => {
  if (!quickFilter) return true;

  switch (quickFilter) {
    case 'missing_unhandled':
      return !!(volume.missingPages && volume.missingPages.trim()) && volume.status !== 'done';
    case 'recently_updated': {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      return volume.updatedAt >= oneHourAgo;
    }
    case 'review_timeout': {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      return volume.status === 'review' && volume.updatedAt < twentyFourHoursAgo;
    }
    case 'stale_unupdated': {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      return volume.status !== 'done' && volume.updatedAt < twentyFourHoursAgo;
    }
    case 'pending_exceptions':
      return volume.hasOpenException;
    case 'closed_exceptions':
      return volume.exceptionCount > 0 && !volume.hasOpenException;
    default:
      return true;
  }
};

export const filterVolumes = (volumes: Volume[], filters: Filters): Volume[] => {
  return volumes.filter(v => {
    if (filters.topic && v.topic !== filters.topic) return false;
    if (filters.assignee && v.assignee !== filters.assignee) return false;
    if (filters.status && v.status !== filters.status) return false;
    if (filters.pageMin !== '' && v.pageCount < filters.pageMin) return false;
    if (filters.pageMax !== '' && v.pageCount > filters.pageMax) return false;
    if (filters.quickFilter && !isQuickFilterMatch(v, filters.quickFilter)) return false;
    return true;
  });
};

export const getUniqueTopics = (volumes: Volume[]): string[] => {
  return Array.from(new Set(volumes.map(v => v.topic))).sort();
};

export const getUniqueAssignees = (volumes: Volume[]): string[] => {
  return Array.from(new Set(volumes.map(v => v.assignee))).sort();
};
