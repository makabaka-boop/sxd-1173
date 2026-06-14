import { useState, useEffect } from 'react';
import { Save, Trash2, X, User, BookOpen, FileText, Package, AlertTriangle, History, AlertOctagon, CheckCircle2, RefreshCw, Play } from 'lucide-react';
import { Volume, STATUS_LABELS, STATUS_COLORS, Status, OPERATION_LABELS, OPERATION_COLORS, ExceptionType, ExceptionPriority, EXCEPTION_TYPE_LABELS, EXCEPTION_STATUS_LABELS, EXCEPTION_STATUS_COLORS, EXCEPTION_PRIORITY_LABELS, EXCEPTION_PRIORITY_COLORS } from '../types';
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
  const flowRecords = useAppStore((state) => state.getFlowRecordsForVolume(volume.id));
  const exceptions = useAppStore((state) => state.getExceptionsForVolume(volume.id));
  const addException = useAppStore((state) => state.addException);
  const processException = useAppStore((state) => state.processException);
  const closeException = useAppStore((state) => state.closeException);
  const reopenException = useAppStore((state) => state.reopenException);

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
  const [showFlowRecords, setShowFlowRecords] = useState(true);
  const [showExceptions, setShowExceptions] = useState(true);
  const [showAddException, setShowAddException] = useState(false);
  const [newException, setNewException] = useState({
    type: 'missing_pages' as ExceptionType,
    description: '',
    priority: 'medium' as ExceptionPriority,
  });
  const [handleNote, setHandleNote] = useState('');
  const [handler, setHandler] = useState('');
  const [activeExceptionId, setActiveExceptionId] = useState<string | null>(null);

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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleAddException = () => {
    if (!newException.description.trim()) return;
    addException(
      volume.id,
      newException.type,
      newException.description,
      '手动登记',
      newException.priority
    );
    setNewException({
      type: 'missing_pages',
      description: '',
      priority: 'medium',
    });
    setShowAddException(false);
  };

  const handleProcessException = (exceptionId: string) => {
    if (!handler.trim()) {
      alert('请输入处理人');
      return;
    }
    processException(exceptionId, handler, handleNote);
    setActiveExceptionId(null);
    setHandleNote('');
    setHandler('');
  };

  const handleCloseException = (exceptionId: string) => {
    if (!handler.trim()) {
      alert('请输入处理人');
      return;
    }
    closeException(exceptionId, handler, handleNote);
    setActiveExceptionId(null);
    setHandleNote('');
    setHandler('');
  };

  const handleReopenException = (exceptionId: string) => {
    if (!handler.trim()) {
      alert('请输入处理人');
      return;
    }
    reopenException(exceptionId, handler, handleNote);
    setActiveExceptionId(null);
    setHandleNote('');
    setHandler('');
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
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

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowExceptions(!showExceptions)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <AlertOctagon className="w-4 h-4 text-red-500" />
              异常处置
              <span className="text-xs text-gray-400">({exceptions.length})</span>
              <span className={cn('transition-transform text-gray-400', showExceptions && 'rotate-180')}>▾</span>
            </button>
            <button
              onClick={() => setShowAddException(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
            >
              <AlertOctagon className="w-3 h-3" />
              登记异常
            </button>
          </div>

          {showExceptions && (
            <div className="space-y-3">
              {showAddException && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800">登记新异常</span>
                    <button
                      onClick={() => setShowAddException(false)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">异常类型</label>
                      <select
                        value={newException.type}
                        onChange={(e) => setNewException(prev => ({ ...prev, type: e.target.value as ExceptionType }))}
                        className="w-full px-2 py-1.5 text-sm border border-red-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {(Object.entries(EXCEPTION_TYPE_LABELS) as [ExceptionType, string][]).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">优先级</label>
                      <select
                        value={newException.priority}
                        onChange={(e) => setNewException(prev => ({ ...prev, priority: e.target.value as ExceptionPriority }))}
                        className="w-full px-2 py-1.5 text-sm border border-red-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        {(Object.entries(EXCEPTION_PRIORITY_LABELS) as [ExceptionPriority, string][]).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">异常描述</label>
                    <textarea
                      value={newException.description}
                      onChange={(e) => setNewException(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="请描述异常情况..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-red-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAddException(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddException}
                      disabled={!newException.description.trim()}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded',
                        newException.description.trim()
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                    >
                      确认登记
                    </button>
                  </div>
                </div>
              )}

              {exceptions.length === 0 && !showAddException && (
                <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                  暂无异常记录
                </div>
              )}

              {exceptions.map((exception) => (
                <div key={exception.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex items-start justify-between p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          EXCEPTION_STATUS_COLORS[exception.status]
                        )}>
                          {EXCEPTION_STATUS_LABELS[exception.status]}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {EXCEPTION_TYPE_LABELS[exception.type]}
                        </span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          EXCEPTION_PRIORITY_COLORS[exception.priority]
                        )}>
                          {EXCEPTION_PRIORITY_LABELS[exception.priority]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{exception.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>来源: {exception.source}</span>
                        <span>登记: {formatTime(exception.createdAt)}</span>
                      </div>
                      {exception.handler && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="text-gray-400">处理人: </span>
                          <span className="font-medium">{exception.handler}</span>
                          {exception.handleNote && (
                            <span className="ml-2">
                              <span className="text-gray-400">备注: </span>
                              {exception.handleNote}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {activeExceptionId === exception.id ? (
                    <div className="border-t border-gray-200 p-3 bg-white space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-600">处理人</label>
                          <input
                            type="text"
                            value={handler}
                            onChange={(e) => setHandler(e.target.value)}
                            placeholder="请输入处理人"
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600">处理备注</label>
                        <textarea
                          value={handleNote}
                          onChange={(e) => setHandleNote(e.target.value)}
                          placeholder="请输入处理备注..."
                          rows={2}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setActiveExceptionId(null);
                            setHandleNote('');
                            setHandler('');
                          }}
                          className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          取消
                        </button>
                        {exception.status === 'pending' && (
                          <button
                            onClick={() => handleProcessException(exception.id)}
                            className="px-3 py-1.5 text-xs bg-amber-500 text-white hover:bg-amber-600 rounded"
                          >
                            开始处置
                          </button>
                        )}
                        {(exception.status === 'pending' || exception.status === 'processing' || exception.status === 'reopened') && (
                          <button
                            onClick={() => handleCloseException(exception.id)}
                            className="px-3 py-1.5 text-xs bg-green-500 text-white hover:bg-green-600 rounded"
                          >
                            闭环
                          </button>
                        )}
                        {exception.status === 'closed' && (
                          <button
                            onClick={() => handleReopenException(exception.id)}
                            className="px-3 py-1.5 text-xs bg-rose-500 text-white hover:bg-rose-600 rounded"
                          >
                            重新打开
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-200 px-3 py-2 flex justify-end gap-2">
                      {exception.status === 'pending' && (
                        <button
                          onClick={() => {
                            setActiveExceptionId(exception.id);
                            setHandler(volume.assignee);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Play className="w-3 h-3" />
                          开始处置
                        </button>
                      )}
                      {(exception.status === 'pending' || exception.status === 'processing' || exception.status === 'reopened') && (
                        <button
                          onClick={() => {
                            setActiveExceptionId(exception.id);
                            setHandler(volume.assignee);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          闭环
                        </button>
                      )}
                      {exception.status === 'closed' && (
                        <button
                          onClick={() => {
                            setActiveExceptionId(exception.id);
                            setHandler(volume.assignee);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <RefreshCw className="w-3 h-3" />
                          重新打开
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowFlowRecords(!showFlowRecords)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-3"
          >
            <History className="w-4 h-4 text-gray-500" />
            流转记录
            <span className="text-xs text-gray-400">({flowRecords.length})</span>
            <span className={cn('transition-transform text-gray-400', showFlowRecords && 'rotate-180')}>▾</span>
          </button>

          {showFlowRecords && (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {flowRecords.length === 0 ? (
                <div className="text-sm text-gray-400 py-4 text-center">暂无流转记录</div>
              ) : (
                flowRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                        OPERATION_COLORS[record.operationType]
                      )}>
                        {OPERATION_LABELS[record.operationType]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700">{record.summary}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatTime(record.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
