import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, AlertTriangle, Package, Check } from 'lucide-react';
import { Volume, STATUS_LABELS, STATUS_COLORS, STATUS_KEYBOARD_MAP } from '../types';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { useEffect } from 'react';

interface VolumeItemProps {
  volume: Volume;
  onStatusChange?: (status: Volume['status']) => void;
}

export const VolumeItem = ({ volume, onStatusChange }: VolumeItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: volume.id });

  const selectedId = useAppStore((state) => state.selectedId);
  const selectedIds = useAppStore((state) => state.selectedIds);
  const toggleSelectedId = useAppStore((state) => state.toggleSelectedId);
  const setSelectedId = useAppStore((state) => state.setSelectedId);
  const isBatchMode = useAppStore((state) => state.isBatchMode);
  const updateVolumeStatus = useAppStore((state) => state.updateVolumeStatus);

  const isSelected = selectedIds.has(volume.id);
  const isActive = selectedId === volume.id && !isBatchMode;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isActive && !isBatchMode && !e.metaKey && !e.ctrlKey) {
        const newStatus = STATUS_KEYBOARD_MAP[e.key];
        if (newStatus && newStatus !== volume.status) {
          updateVolumeStatus(volume.id, newStatus);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isBatchMode, volume.id, volume.status, updateVolumeStatus]);

  const handleClick = (e: React.MouseEvent) => {
    if (isBatchMode) {
      e.preventDefault();
      toggleSelectedId(volume.id);
    } else {
      setSelectedId(volume.id);
    }
  };

  const handleStatusClick = (e: React.MouseEvent, newStatus: Volume['status']) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(newStatus);
    } else {
      updateVolumeStatus(volume.id, newStatus);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-3 border-b border-gray-100 cursor-pointer transition-all',
        isDragging && 'opacity-50 bg-blue-50',
        isActive && 'bg-blue-50',
        isSelected && 'bg-purple-50',
        !isDragging && !isActive && !isSelected && 'hover:bg-gray-50'
      )}
    >
      {isBatchMode && (
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-purple-600 border-purple-600'
                : 'border-gray-300'
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}

      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono font-semibold text-gray-900">
            第{volume.volumeNumber}册
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              STATUS_COLORS[volume.status]
            )}
          >
            {STATUS_LABELS[volume.status]}
          </span>
          {volume.missingPages && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          )}
          {volume.baggingStatus && (
            <Package className="w-3.5 h-3.5 text-green-500" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="truncate">{volume.topic}</span>
          <span className="flex-shrink-0">{volume.pageCount}页</span>
          <span className="truncate">{volume.assignee}</span>
        </div>
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((status) => (
            <button
              key={status}
              onClick={(e) => handleStatusClick(e, status)}
              title={`${STATUS_LABELS[status]} (${Object.keys(STATUS_KEYBOARD_MAP).find(
                k => STATUS_KEYBOARD_MAP[k] === status
              )})`}
              className={cn(
                'w-5 h-5 rounded text-xs font-medium transition-colors',
                volume.status === status
                  ? STATUS_COLORS[status]
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              )}
            >
              {Object.keys(STATUS_KEYBOARD_MAP).find(
                k => STATUS_KEYBOARD_MAP[k] === status
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
