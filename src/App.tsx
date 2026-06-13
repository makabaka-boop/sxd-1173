import { useState, useEffect } from 'react';
import { TaskSummary } from './components/TaskSummary';
import { VolumeList } from './components/VolumeList';
import { VolumeDetail } from './components/VolumeDetail';
import { CheckPanel } from './components/CheckPanel';
import { LinearChecklist } from './components/LinearChecklist';
import { AddVolumeModal } from './components/AddVolumeModal';
import { useAppStore } from './store';
import { generateMockData } from './data/mockData';
import { db } from './db';
import { Database } from 'lucide-react';

function App() {
  const view = useAppStore((state) => state.view);
  const selectedId = useAppStore((state) => state.selectedId);
  const volumes = useAppStore((state) => state.volumes);
  const loadVolumes = useAppStore((state) => state.loadVolumes);
  const setSelectedId = useAppStore((state) => state.setSelectedId);
  const addVolume = useAppStore((state) => state.addVolume);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showInitButton, setShowInitButton] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadVolumes();
      const existing = await db.getAll();
      setShowInitButton(existing.length === 0);
    };
    init();
  }, [loadVolumes]);

  const selectedVolume = volumes.find((v) => v.id === selectedId);

  const handleInitData = async () => {
    if (confirm('是否导入示例数据？这将生成30条测试分册记录。')) {
      const mockData = generateMockData(30);
      for (const item of mockData) {
        await addVolume(item);
      }
      setShowInitButton(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 print:bg-white">
      <TaskSummary />

      {showInitButton && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Database className="w-5 h-5" />
              <span>数据库为空，是否导入示例数据以体验完整功能？</span>
            </div>
            <button
              onClick={handleInitData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              导入示例数据
            </button>
          </div>
        </div>
      )}

      {view === 'list' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-gray-200 flex flex-col overflow-hidden">
            <VolumeList onAddVolume={() => setIsAddModalOpen(true)} />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <CheckPanel />
            <div className="flex-1 overflow-hidden">
              {selectedVolume ? (
                <VolumeDetail
                  volume={selectedVolume}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white">
                  <p className="text-sm">选择左侧分册查看详情</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <LinearChecklist />
      )}

      <AddVolumeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

export default App;
