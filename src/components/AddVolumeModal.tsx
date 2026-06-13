import { useState } from 'react';
import { X, Save, BookOpen } from 'lucide-react';
import { useAppStore } from '../store';
import { STATUS_LABELS, Status } from '../types';
import { cn } from '../utils/cn';

interface AddVolumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddVolumeModal = ({ isOpen, onClose }: AddVolumeModalProps) => {
  const addVolume = useAppStore((state) => state.addVolume);
  const volumes = useAppStore((state) => state.volumes);
  const topics = useAppStore((state) => state.getTopics());
  const assignees = useAppStore((state) => state.getAssignees());

  const nextVolumeNumber = volumes.length > 0
    ? Math.max(...volumes.map(v => v.volumeNumber)) + 1
    : 1;

  const [formData, setFormData] = useState({
    volumeNumber: nextVolumeNumber,
    topic: topics[0] || '安全操作',
    pageCount: 50,
    missingPages: '',
    baggingStatus: false,
    assignee: assignees[0] || '未分配',
    notes: '',
    status: 'pending' as Status,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.volumeNumber || formData.volumeNumber < 1) {
      newErrors.volumeNumber = '请输入有效的分册编号';
    }
    
    if (volumes.some(v => v.volumeNumber === formData.volumeNumber)) {
      newErrors.volumeNumber = '该分册编号已存在';
    }
    
    if (!formData.pageCount || formData.pageCount < 1) {
      newErrors.pageCount = '请输入有效的页数';
    }
    
    if (!formData.topic.trim()) {
      newErrors.topic = '请选择主题';
    }
    
    if (!formData.assignee.trim()) {
      newErrors.assignee = '请选择责任人';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = <K extends keyof typeof formData>(
    key: K,
    value: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addVolume({
      ...formData,
      topic: formData.topic.trim(),
      assignee: formData.assignee.trim(),
      missingPages: formData.missingPages.trim(),
      notes: formData.notes.trim(),
      sortOrder: volumes.length,
    });

    onClose();
    setFormData({
      volumeNumber: nextVolumeNumber + 1,
      topic: topics[0] || '安全操作',
      pageCount: 50,
      missingPages: '',
      baggingStatus: false,
      assignee: assignees[0] || '未分配',
      notes: '',
      status: 'pending',
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">新增分册</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">分册编号 *</label>
              <input
                type="number"
                value={formData.volumeNumber}
                onChange={(e) => handleChange('volumeNumber', Number(e.target.value))}
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
              <label className="block text-sm font-medium text-gray-700">页数 *</label>
              <input
                type="number"
                value={formData.pageCount}
                onChange={(e) => handleChange('pageCount', Number(e.target.value))}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.pageCount ? 'border-red-300' : 'border-gray-200'
                )}
              />
              {errors.pageCount && (
                <p className="text-xs text-red-500">{errors.pageCount}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">主题分类 *</label>
            <select
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.topic ? 'border-red-300' : 'border-gray-200'
              )}
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
              <option value="其他">其他</option>
            </select>
            {errors.topic && (
              <p className="text-xs text-red-500">{errors.topic}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">责任人 *</label>
            <select
              value={formData.assignee}
              onChange={(e) => handleChange('assignee', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.assignee ? 'border-red-300' : 'border-gray-200'
              )}
            >
              {assignees.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="未分配">未分配</option>
            </select>
            {errors.assignee && (
              <p className="text-xs text-red-500">{errors.assignee}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">初始状态</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleChange('status', status)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    formData.status === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">缺页说明</label>
            <textarea
              value={formData.missingPages}
              onChange={(e) => handleChange('missingPages', e.target.value)}
              placeholder="例如：第3-5页，第12页"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">补充备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="输入补充备注信息..."
              rows={3}
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
              <span className="text-sm text-gray-700">已装袋</span>
            </label>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
