import { useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

const allLevels = [
  { id: 'l1', name: '探索森林', status: 'unlocked', stars: 0 },
  { id: 'l2', name: '暗影城堡', status: 'locked', stars: 0 },
  { id: 'l3', name: '火山挑战', status: 'completed', stars: 3 },
];

const filters = [
  { value: 'all', label: '全部' },
  { value: 'completed', label: '已解' },
  { value: 'unlocked', label: '未解' },
  { value: 'favorite', label: '收藏' },
];

const LevelsPage = () => {
  const [filter, setFilter] = useState('all');

  const visibleLevels = useMemo(() => {
    if (filter === 'all') return allLevels;
    return allLevels.filter((level) => level.status === filter);
  }, [filter]);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card title="章节地图" subtitle="按筛选查看当前章节的关卡进度">
        <Select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="筛选关卡">
          {filters.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {visibleLevels.map((level) => (
          <Card
            key={level.id}
            title={level.name}
            subtitle={level.status === 'locked' ? '未解锁' : '挑战中'}
            actions={<Button variant="primary">{level.status === 'locked' ? '待解锁' : '进入准备页'}</Button>}
          >
            <Badge tone={level.status === 'completed' ? 'success' : level.status === 'locked' ? 'warning' : 'info'}>
              {level.status === 'completed' ? `⭐ ${level.stars}` : level.status === 'locked' ? '锁定' : '可挑战'}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LevelsPage;
