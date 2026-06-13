import { useState, useEffect } from 'react';
import { Save, Trash2, X, User, BookOpen, FileText, Package, AlertTriangle } from 'lucide-react';
import { Volume, STATUS_LABELS, STATUS_COLORS, Status } from '../types';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';

interface VolumeDetailProps {
  volume: Volume;
  onClose: () => void;
}

export const VolumeDetail = ({ volume, onClose }: VolumeDetailProps) => {
  const updateVolume = useAppStore((state) => state.updateVolume);
  const deleteVolume = useAppStore((state) => state.deleteVolume);
  const topics = useAppStore((state) => state.getTopics());
  const assignees = useAppStore((state) => state.getAssignees());
  const allVolumes = useAppStore((state) => state.volumes);

  const [formData, setFormData] = useState({
    volumeNumber: volume.volumeNumber,
    topic: volume.topic,
    pageCount: volume.pageCount,
    missingPages: volume.missingPages,
    baggingStatus: volume.baggingStatus,
    assignee: volume.assignee,
    notes: volume.notes,
    status: volume.status,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      volumeNumber: volume.volumeNumber,
      topic: volume.topic,
      pageCount: volume.pageCount,
      missingPages: volume.missingPages,
      baggingStatus: volume.baggingStatus,
      assignee: volume.assignee,
      notes: volume.notes,
      status: volume.status,
    });
    setHasChanges(false);
    setErrors({});
  }, [volume.id]);

  const handleChange = <K extends keyof typeof formData>(
    key: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.volumeNumber || formData.volumeNumber < 1) {
      newErrors.volumeNumber = '请输入有效的分册编号';
    }
    if (formData.volumeNumber !== volume.volumeNumber) {
      const duplicate = allVolumes.find(
        (v) => v.id !== volume.id && v.volumeNumber === formData.volumeNumber
      );
      if (duplicate) {
        newErrors.volumeNumber = `第 ${formData.volumeNumber} 册编号已存在`;
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    updateVolume({
      ...volume,
      ...formData,
    });
    setHasChanges(false);
    setErrors({});
  };

  const handleDelete = () => {
    if (confirm(`确定要删除第 ${volume.volumeNumber} 册吗？`)) {
      deleteVolume(volume.id);
      onClose();
    }
  };

  const handleStatusClick = (status: Status) => {
    handleChange('status', status);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">分册详情</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              第 {formData.volumeNumber} 册
            </div>
            <div className="text-sm text-gray-500">{formData.topic}</div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">当前状态</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([status, label]) => (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  formData.status === status
                    ? STATUS_COLORS[status]
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">分册编号</label>
            <input
              type="number"
              value={formData.volumeNumber}
              onChange={(e) => {
                handleChange('volumeNumber', Number(e.target.value));
                if (errors.volumeNumber) {
                  setErrors((prev) => ({ ...prev, volumeNumber: '' }));
                }
              }}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.volumeNumber ? 'border-red-300' : 'border-gray-200'
              )}
            />
            {errors.volumeNumber && (
              <p className="text-xs text-red-500">{errors.volumeNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">页数</label>
            <input
              type="number"
              value={formData.pageCount}
              onChange={(e) => handleChange('pageCount', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">主题分类</label>
          <select
            value={formData.topic}
            onChange={(e) => handleChange('topic', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
            <option value="其他">其他</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" /> 责任人
          </label>
          <select
            value={formData.assignee}
            onChange={(e) => handleChange('assignee', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {assignees.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="未分配">未分配</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> 缺页说明
          </label>
          <textarea
            value={formData.missingPages}
            onChange={(e) => handleChange('missingPages', e.target.value)}
            placeholder="例如：第3-5页，第12页"
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.baggingStatus}
              onChange={(e) => handleChange('baggingStatus', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Package className="w-4 h-4" /> 已装袋
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 补充备注
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="输入补充备注信息..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" /> 删除
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={cn(
            'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
            hasChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          <Save className="w-4 h-4" /> 保存
        </button>
      </div>
    </div>
  );
};
