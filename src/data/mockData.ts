import { Volume } from '../types';

const TOPICS = ['安全操作', '技术规范', '质量管理', '设备维护', '应急处理'];
const ASSIGNEES = ['张三', '李四', '王五', '赵六', '钱七'];
const STATUSES: Volume['status'][] = ['pending', 'bagging', 'done', 'review'];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const generateMockData = (count: number = 30): Omit<Volume, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const rand = seededRandom(Date.now());
  const volumes: Omit<Volume, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  for (let i = 1; i <= count; i++) {
    const hasMissing = rand() < 0.3;
    const missingPages = hasMissing 
      ? `${Math.floor(rand() * 5) + 1}-${Math.floor(rand() * 5) + 6}, ${Math.floor(rand() * 10) + 10}`
      : '';
    
    volumes.push({
      volumeNumber: i,
      topic: TOPICS[Math.floor(rand() * TOPICS.length)],
      pageCount: Math.floor(rand() * 80) + 20,
      missingPages,
      baggingStatus: rand() > 0.5,
      assignee: ASSIGNEES[Math.floor(rand() * ASSIGNEES.length)],
      notes: rand() > 0.7 ? '需要重点检查装订质量' : '',
      status: STATUSES[Math.floor(rand() * STATUSES.length)],
      sortOrder: i - 1,
      hasOpenException: false,
      exceptionCount: 0,
    });
  }
  
  volumes[3].pageCount = 200;
  volumes[7].pageCount = 15;
  volumes[12].pageCount = 180;
  
  return volumes;
};
