import { Filter, RotateCcw, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { STATUS_LABELS, Status } from '../types';

interface FilterPanelProps {
  onAddVolume: () => void;
}

export const FilterPanel = ({ onAddVolume }: FilterPanelProps) => {
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const topics = useAppStore((state) => state.getTopics());
  const assignees = useAppStore((state) => state.getAssignees());
  const filteredCount = useAppStore((state) => state.getFilteredVolumes().length);
  const totalCount = useAppStore((state) => state.volumes.length);

  const hasActiveFilters = filters.topic || filters.assignee || filters.status || 
                          filters.pageMin !== '' || filters.pageMax !== '';

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
