import { Volume, CheckResult, TaskSummary, Filters } from '../types';

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

export const getTaskSummary = (volumes: Volume[]): TaskSummary => {
  const summary: TaskSummary = {
    total: volumes.length,
    pending: 0,
    bagging: 0,
    done: 0,
    review: 0,
    totalPages: 0,
    missingPageCount: 0,
  };
  
  volumes.forEach(v => {
    summary[v.status]++;
    summary.totalPages += v.pageCount;
    if (v.missingPages && v.missingPages.trim()) {
      summary.missingPageCount++;
    }
  });
  
  return summary;
};

export const filterVolumes = (volumes: Volume[], filters: Filters): Volume[] => {
  return volumes.filter(v => {
    if (filters.topic && v.topic !== filters.topic) return false;
    if (filters.assignee && v.assignee !== filters.assignee) return false;
    if (filters.status && v.status !== filters.status) return false;
    if (filters.pageMin !== '' && v.pageCount < filters.pageMin) return false;
    if (filters.pageMax !== '' && v.pageCount > filters.pageMax) return false;
    return true;
  });
};

export const getUniqueTopics = (volumes: Volume[]): string[] => {
  return Array.from(new Set(volumes.map(v => v.topic))).sort();
};

export const getUniqueAssignees = (volumes: Volume[]): string[] => {
  return Array.from(new Set(volumes.map(v => v.assignee))).sort();
};
