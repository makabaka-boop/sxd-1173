import { BookOpen, AlertTriangle, Eye, FileText, Users } from 'lucide-react';
import { useAppStore } from '../store';
import { STATUS_LABELS } from '../types';
import { cn } from '../utils/cn';

export const TaskSummary = () => {
  const summary = useAppStore((state) => state.getTaskSummary());
  const checkResults = useAppStore((state) => state.getCheckResults());
  const setView = useAppStore((state) => state.setView);
  const view = useAppStore((state) => state.view);
  const isBatchMode = useAppStore((state) => state.isBatchMode);
  const setBatchMode = useAppStore((state) => state.setBatchMode);
  
  const progressPercent = summary.total > 0 
    ? Math.round((summary.done / summary.total) * 100) 
    : 0;

  const statusCards = [
    { key: 'pending', label: STATUS_LABELS.pending, count: summary.pending, color: 'bg-status-pending' },
    { key: 'bagging', label: STATUS_LABELS.bagging, count: summary.bagging, color: 'bg-status-bagging' },
    { key: 'review', label: STATUS_LABELS.review, count: summary.review, color: 'bg-status-review' },
    { key: 'done', label: STATUS_LABELS.done, count: summary.done, color: 'bg-status-done' },
  ] as const;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">培训手册分册清点工具</h1>
              <p className="text-sm text-gray-500">
                共 <span className="font-semibold text-gray-700">{summary.total}</span> 册，
                <span className="font-semibold text-gray-700">{summary.totalPages}</span> 页
                {summary.missingPageCount > 0 && (
                  <span className="ml-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {summary.missingPageCount} 册存在缺页
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'list' ? 'checklist' : 'list')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                view === 'checklist'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {view === 'checklist' ? (
                <><Eye className="w-4 h-4" /> 返回列表</>
              ) : (
                <><FileText className="w-4 h-4" /> 线性执行清单</>
              )}
            </button>
            <button
              onClick={() => setBatchMode(!isBatchMode)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isBatchMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Users className="w-4 h-4" />
              {isBatchMode ? '退出批量' : '批量操作'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {statusCards.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 min-w-[140px]"
              >
                <div className={cn('w-3 h-3 rounded-full', item.color)} />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">整体进度</span>
              <span className="font-medium text-gray-900">{progressPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {checkResults.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {checkResults.map((result, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
                    result.severity === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {result.severity === 'error' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {result.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
