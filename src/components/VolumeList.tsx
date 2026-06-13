import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { VolumeItem } from './VolumeItem';
import { useAppStore } from '../store';
import { FilterPanel } from './FilterPanel';
import { CheckSquare, Square, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { Status } from '../types';

interface VolumeListProps {
  onAddVolume: () => void;
}

export const VolumeList = ({ onAddVolume }: VolumeListProps) => {
  const volumes = useAppStore((state) => state.getFilteredVolumes());
  const reorderVolumes = useAppStore((state) => state.reorderVolumes);
  const isBatchMode = useAppStore((state) => state.isBatchMode);
  const selectedIds = useAppStore((state) => state.selectedIds);
  const selectAll = useAppStore((state) => state.selectAll);
  const clearSelection = useAppStore((state) => state.clearSelection);
  const batchUpdateStatus = useAppStore((state) => state.batchUpdateStatus);
  const batchDelete = useAppStore((state) => state.batchDelete);
  const allVolumes = useAppStore((state) => state.volumes);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fullOldIndex = allVolumes.findIndex((v) => v.id === active.id);
      const fullNewIndex = allVolumes.findIndex((v) => v.id === over.id);
      
      reorderVolumes(fullOldIndex, fullNewIndex);
    }
  };

  const allSelected = volumes.length > 0 && volumes.every((v) => selectedIds.has(v.id));

  const handleBatchStatus = (status: Status) => {
    if (selectedIds.size > 0) {
      batchUpdateStatus(Array.from(selectedIds), status);
      clearSelection();
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size > 0 && confirm(`确定要删除选中的 ${selectedIds.size} 册吗？`)) {
      batchDelete(Array.from(selectedIds));
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <FilterPanel onAddVolume={onAddVolume} />

      {isBatchMode && (
        <div className="bg-purple-50 border-b border-purple-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={allSelected ? clearSelection : selectAll}
                className="flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {allSelected ? '取消全选' : '全选当前筛选结果'}
              </button>
              <span className="text-sm text-purple-600">
                已选 {selectedIds.size} 项
              </span>
            </div>
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded text-sm',
                selectedIds.size > 0
                  ? 'text-red-600 hover:bg-red-100'
                  : 'text-gray-300 cursor-not-allowed'
              )}
            >
              <Trash2 className="w-4 h-4" /> 删除
            </button>
          </div>
          <div className="flex gap-2">
            {(['pending', 'bagging', 'done', 'review'] as Status[]).map((status) => (
              <button
                key={status}
                onClick={() => handleBatchStatus(status)}
                disabled={selectedIds.size === 0}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium',
                  selectedIds.size > 0
                    ? 'bg-white border border-gray-200 hover:bg-gray-50'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                )}
              >
                批量设为{status === 'pending' ? '待补页' : status === 'bagging' ? '待装袋' : status === 'done' ? '已完成' : '待复核'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {volumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">暂无匹配的分册记录</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={volumes.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-100">
                {volumes.map((volume) => (
                  <VolumeItem key={volume.id} volume={volume} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-400 bg-gray-50">
        提示：选中条目后按 1/2/3/4 快速切换状态 · 拖拽调整顺序
      </div>
    </div>
  );
};
