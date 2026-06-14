import { Printer, ArrowLeft, CheckCircle, Circle, Clock, Package, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store';
import { Volume, STATUS_LABELS, Status } from '../types';
import { cn } from '../utils/cn';
import { useMemo } from 'react';

const getPriority = (volume: Volume, now: number): number => {
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const hasMissing = !!(volume.missingPages && volume.missingPages.trim());
  const isStale = volume.updatedAt < twentyFourHoursAgo && volume.status !== 'done';

  if (hasMissing && isStale) return 0;
  if (volume.status === 'review' && volume.updatedAt < twentyFourHoursAgo) return 1;
  if (hasMissing && volume.status !== 'done') return 2;
  if (volume.status === 'pending') return 3;
  if (volume.status === 'review') return 4;
  if (volume.status === 'bagging') return 5;
  if (volume.status === 'done') return 6;
  return 7;
};

const getStatusIcon = (status: Status) => {
  switch (status) {
    case 'done':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'pending':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    case 'bagging':
      return <Package className="w-5 h-5 text-blue-500" />;
    case 'review':
      return <Clock className="w-5 h-5 text-purple-500" />;
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
};

export const LinearChecklist = () => {
  const filteredVolumes = useAppStore((state) => state.getFilteredVolumes());
  const setView = useAppStore((state) => state.setView);
  const updateVolumeStatus = useAppStore((state) => state.updateVolumeStatus);
  const filters = useAppStore((state) => state.filters);

  const sortedVolumes = useMemo(() => {
    const now = Date.now();
    return [...filteredVolumes].sort((a, b) => {
      const priorityDiff = getPriority(a, now) - getPriority(b, now);
      if (priorityDiff !== 0) return priorityDiff;
      return a.volumeNumber - b.volumeNumber;
    });
  }, [filteredVolumes]);

  const handlePrint = () => {
    window.print();
  };

  const getNextStatus = (status: Status): Status => {
    const order: Status[] = ['pending', 'bagging', 'review', 'done'];
    const currentIndex = order.indexOf(status);
    return order[(currentIndex + 1) % order.length];
  };

  const handleStatusToggle = (id: string, currentStatus: Status) => {
    updateVolumeStatus(id, getNextStatus(currentStatus));
  };

  const hasActiveFilters = filters.topic || filters.assignee || filters.status ||
                          filters.pageMin !== '' || filters.pageMax !== '' || filters.quickFilter;

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  return (
    <div className="h-full flex flex-col bg-gray-50 print:bg-white">
      <div className="bg-white border-b border-gray-200 px-4 py-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              返回列表
            </button>
            <div>
              <h2 className="font-semibold text-gray-900">线性执行清单</h2>
              <p className="text-sm text-gray-500">
                按优先级排序的待处理任务（异常优先）
                {hasActiveFilters && ' (已筛选)'}
              </p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            打印清单
          </button>
        </div>
      </div>

      <div className="print:max-w-none max-w-4xl mx-auto w-full flex-1 overflow-y-auto p-4 print:p-0">
        <div className="print:block hidden mb-8">
          <h1 className="text-2xl font-bold text-center mb-2">培训手册分册清点执行清单</h1>
          <p className="text-center text-gray-500 text-sm">
            生成时间: {new Date().toLocaleString('zh-CN')}
          </p>
          {hasActiveFilters && (
            <p className="text-center text-gray-500 text-sm mt-1">
              筛选条件已应用
            </p>
          )}
        </div>

        <div className="space-y-2 print:space-y-1">
          {sortedVolumes.map((volume, index) => {
            const hasMissing = !!(volume.missingPages && volume.missingPages.trim());
            const isStale = volume.updatedAt < twentyFourHoursAgo && volume.status !== 'done';
            const isReviewTimeout = volume.status === 'review' && volume.updatedAt < twentyFourHoursAgo;

            return (
              <div
                key={volume.id}
                onClick={() => handleStatusToggle(volume.id, volume.status)}
                className={cn(
                  'group flex items-center gap-4 bg-white print:bg-transparent rounded-lg print:rounded-none p-4 print:p-2 border border-gray-200 print:border-0 print:border-b print:border-gray-300 cursor-pointer transition-all hover:shadow-md print:hover:shadow-none',
                  volume.status === 'done' && 'opacity-70',
                  hasMissing && isStale && 'border-l-4 border-l-red-400 bg-red-50/50',
                  isReviewTimeout && !hasMissing && 'border-l-4 border-l-amber-400 bg-amber-50/50',
                )}
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <span className="text-sm text-gray-400 print:hidden">{index + 1}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle(volume.id, volume.status);
                  }}
                  className="flex-shrink-0 print:hidden"
                >
                  {getStatusIcon(volume.status)}
                </button>

                <div className="print:hidden flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="font-mono font-bold text-gray-600">
                      {volume.volumeNumber}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="print:font-mono font-semibold text-gray-900">
                      第{volume.volumeNumber}册
                    </span>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium print:px-1 print:py-0',
                      volume.status === 'pending' && 'bg-amber-100 text-amber-700',
                      volume.status === 'bagging' && 'bg-blue-100 text-blue-700',
                      volume.status === 'review' && 'bg-purple-100 text-purple-700',
                      volume.status === 'done' && 'bg-green-100 text-green-700 line-through',
                    )}>
                      {STATUS_LABELS[volume.status]}
                    </span>
                    {hasMissing && isStale && (
                      <span className="print:hidden text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 异常停滞
                      </span>
                    )}
                    {isReviewTimeout && !hasMissing && (
                      <span className="print:hidden text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 复核超时
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="print:hidden">{volume.topic}</span>
                    <span className="print:hidden">{volume.pageCount}页</span>
                    <span className="print:hidden">{volume.assignee}</span>
                    {volume.missingPages && (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 print:hidden" />
                        缺页: {volume.missingPages}
                      </span>
                    )}
                  </div>
                </div>

                <div className="print:hidden flex-shrink-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  点击推进状态
                </div>

                <div className="hidden print:block w-20" />
              </div>
            );
          })}
        </div>

        {sortedVolumes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-sm">暂无待处理任务</p>
          </div>
        )}

        <div className="print:block hidden mt-8 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">总计: </span>
              <span className="font-medium">{sortedVolumes.length} 册</span>
            </div>
            <div>
              <span className="text-gray-500">总页数: </span>
              <span className="font-medium">
                {sortedVolumes.reduce((sum, v) => sum + v.pageCount, 0)} 页
              </span>
            </div>
            <div>
              <span className="text-gray-500">已完成: </span>
              <span className="font-medium text-green-600">
                {sortedVolumes.filter(v => v.status === 'done').length} 册
              </span>
            </div>
            <div>
              <span className="text-gray-500">待处理: </span>
              <span className="font-medium text-amber-600">
                {sortedVolumes.filter(v => v.status !== 'done').length} 册
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
