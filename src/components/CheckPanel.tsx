import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, History, AlertOctagon } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store';
import { CheckResult, OPERATION_LABELS, OPERATION_COLORS, ExceptionType, ExceptionPriority } from '../types';
import { cn } from '../utils/cn';

export const CheckPanel = () => {
  const checkResults = useAppStore((state) => state.getCheckResults());
  const volumes = useAppStore((state) => state.volumes);
  const setSelectedId = useAppStore((state) => state.setSelectedId);
  const getFlowRecordsForVolume = useAppStore((state) => state.getFlowRecordsForVolume);
  const addException = useAppStore((state) => state.addException);

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getExceptionType = (checkType: CheckResult['type']): ExceptionType | null => {
    switch (checkType) {
      case 'gap':
        return 'number_gap';
      case 'pageConcentration':
      case 'topicVariance':
        return 'page_abnormal';
      default:
        return null;
    }
  };

  const getExceptionPriority = (severity: CheckResult['severity']): ExceptionPriority => {
    return severity === 'error' ? 'high' : 'medium';
  };

  const handleCreateException = (volumeId: string, checkType: CheckResult['type'], description: string, severity: CheckResult['severity']) => {
    const exceptionType = getExceptionType(checkType);
    if (!exceptionType) return;
    
    const priority = getExceptionPriority(severity);
    addException(volumeId, exceptionType, description, '自动检查', priority);
    setSelectedId(volumeId);
  };

  const getTypeIcon = (type: CheckResult['type']) => {
    switch (type) {
      case 'gap':
        return <XCircle className="w-5 h-5" />;
      case 'pageConcentration':
      case 'topicVariance':
      case 'assigneeLoad':
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: CheckResult['type']) => {
    switch (type) {
      case 'gap':
        return '编号断档';
      case 'pageConcentration':
        return '页数异常';
      case 'topicVariance':
        return '主题差异';
      case 'assigneeLoad':
        return '负载不均';
    }
  };

  const handleDetailClick = (detail: string) => {
    const match = detail.match(/第 (\d+) 册/);
    if (match) {
      const volumeNumber = parseInt(match[1]);
      const volume = volumes.find((v) => v.volumeNumber === volumeNumber);
      if (volume) {
        setSelectedId(volume.id);
      }
    }
  };

  const getVolumeFromDetail = (detail: string) => {
    const match = detail.match(/第 (\d+) 册/);
    if (!match) return null;
    return volumes.find((v) => v.volumeNumber === parseInt(match[1])) || null;
  };

  const getAssigneeFromDetail = (detail: string) => {
    const match = detail.match(/^(.+?)\s*\(/);
    return match?.[1] || null;
  };

  const getLatestRecord = (volumeIds: string[]) => {
    return volumeIds
      .flatMap((id) => getFlowRecordsForVolume(id))
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  };

  const errorCount = checkResults.filter((r) => r.severity === 'error').length;
  const warningCount = checkResults.filter((r) => r.severity === 'warning').length;

  if (checkResults.length === 0) {
    return (
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <div className="font-medium text-green-800">检查通过</div>
            <div className="text-sm text-green-600">
              未发现编号断档、页数异常或负载不均等问题
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">自动检查结果</h3>
        <div className="flex items-center gap-3 text-sm">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              {errorCount} 个错误
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              {warningCount} 个警告
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {checkResults.map((result, index) => {
          const isExpanded = expandedItems.has(index);
          return (
            <div
              key={index}
              className={cn(
                'rounded-lg border overflow-hidden',
                result.severity === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-amber-200 bg-amber-50'
              )}
            >
              <button
                onClick={() => toggleExpand(index)}
                className="w-full flex items-start gap-3 p-3 text-left"
              >
                <span
                  className={cn(
                    'mt-0.5 flex-shrink-0',
                    result.severity === 'error' ? 'text-red-600' : 'text-amber-600'
                  )}
                >
                  {getTypeIcon(result.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        result.severity === 'error'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-amber-200 text-amber-800'
                      )}
                    >
                      {getTypeLabel(result.type)}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        result.severity === 'error' ? 'text-red-800' : 'text-amber-800'
                      )}
                    >
                      {result.message}
                    </span>
                  </div>
                </div>
                {result.details && result.details.length > 0 && (
                  <span className="flex-shrink-0 text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </span>
                )}
              </button>
              {isExpanded && result.details && result.details.length > 0 && (
                <div
                  className={cn(
                    'px-12 pb-3 space-y-1',
                    result.severity === 'error' ? 'text-red-700' : 'text-amber-700'
                  )}
                >
                  {result.details.map((detail: string, detailIndex: number) => {
                    const volume = getVolumeFromDetail(detail);
                    const assignee = result.type === 'assigneeLoad' ? getAssigneeFromDetail(detail) : null;
                    const assigneeVolumes = assignee
                      ? volumes.filter((v) => v.assignee === assignee && v.status !== 'done')
                      : [];
                    const lastRecord = volume
                      ? getFlowRecordsForVolume(volume.id)[0]
                      : getLatestRecord(assigneeVolumes.map((v) => v.id));
                    const canCreateException = volume && getExceptionType(result.type);

                    return (
                      <div key={detailIndex}>
                        {volume ? (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleDetailClick(detail)}
                              className="flex-1 text-left text-sm px-2 py-1 rounded hover:bg-white/50 transition-colors"
                            >
                              {detail}
                            </button>
                            {canCreateException && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateException(volume.id, result.type, detail, result.severity);
                                }}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                                  result.severity === 'error'
                                    ? 'bg-red-200 text-red-800 hover:bg-red-300'
                                    : 'bg-amber-200 text-amber-800 hover:bg-amber-300'
                                )}
                              >
                                <AlertOctagon className="w-3 h-3" />
                                发起处置
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm px-2 py-1">
                            {detail}
                            {result.type === 'gap' && (
                              <span className="ml-2 text-xs text-gray-500">暂无对应分册</span>
                            )}
                          </div>
                        )}
                        {assigneeVolumes.length > 0 && (
                          <div className="ml-4 mt-1 flex flex-wrap gap-1">
                            {assigneeVolumes.slice(0, 5).map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className="px-1.5 py-0.5 rounded bg-white/60 hover:bg-white text-xs"
                              >
                                第{item.volumeNumber}册
                              </button>
                            ))}
                            {assigneeVolumes.length > 5 && (
                              <span className="px-1.5 py-0.5 text-xs text-gray-500">等{assigneeVolumes.length}册</span>
                            )}
                          </div>
                        )}
                        {lastRecord && (
                          <div className="flex items-center gap-2 ml-4 mt-0.5 text-xs text-gray-500">
                            <History className="w-3 h-3" />
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium',
                              OPERATION_COLORS[lastRecord.operationType]
                            )}>
                              {OPERATION_LABELS[lastRecord.operationType]}
                            </span>
                            <span>{lastRecord.summary}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
