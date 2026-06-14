import { Filter, RotateCcw, Plus, AlertTriangle, Clock, AlertCircle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store';
import { STATUS_LABELS, Status, QuickFilter } from '../types';
import { cn } from '../utils/cn';

interface FilterPanelProps {
  onAddVolume: () => void;
}

const QUICK_FILTERS: { key: QuickFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'missing_unhandled', label: '有缺页未处理', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { key: 'pending_exceptions', label: '待处理异常', icon: <AlertOctagon className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
  { key: 'closed_exceptions', label: '已闭环异常', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { key: 'recently_updated', label: '最近更新', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { key: 'review_timeout', label: '待复核超时', icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
  { key: 'stale_unupdated', label: '超24h未更新', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100' },
];

export const FilterPanel = ({ onAddVolume }: FilterPanelProps) => {
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const topics = useAppStore((state) => state.getTopics());
  const assignees = useAppStore((state) => state.getAssignees());
  const filteredCount = useAppStore((state) => state.getFilteredVolumes().length);
  const totalCount = useAppStore((state) => state.volumes.length);

  const hasActiveFilters = filters.topic || filters.assignee || filters.status ||
                          filters.pageMin !== '' || filters.pageMax !== '' || filters.quickFilter;

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">筛选器</span>
          <span className="text-xs text-gray-400">
            显示 {filteredCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-3 h-3" /> 重置
            </button>
          )}
          <button
            onClick={onAddVolume}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 新增
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.key}
            onClick={() => setFilters({
              quickFilter: filters.quickFilter === qf.key ? '' : qf.key,
            })}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filters.quickFilter === qf.key
                ? qf.color
                : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'
            )}
          >
            {qf.icon}
            {qf.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">主题</label>
          <select
            value={filters.topic}
            onChange={(e) => setFilters({ topic: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部主题</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">责任人</label>
          <select
            value={filters.assignee}
            onChange={(e) => setFilters({ assignee: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部责任人</option>
            {assignees.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">状态</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as Status | '' })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">页数 ≥</label>
          <input
            type="number"
            value={filters.pageMin}
            onChange={(e) => setFilters({ pageMin: e.target.value ? Number(e.target.value) : '' })}
            placeholder="最小页数"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">页数 ≤</label>
          <input
            type="number"
            value={filters.pageMax}
            onChange={(e) => setFilters({ pageMax: e.target.value ? Number(e.target.value) : '' })}
            placeholder="最大页数"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
