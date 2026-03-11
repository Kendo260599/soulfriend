/**
 * WorldMapTab — World map locations + location lore
 */

import React from 'react';
import { useGameFi } from './GameFiContext';
import { LOCATION_ICONS } from './config';
import {
  SectionTitle, Grid,
  LocationCard, LocationIcon, LocationName, LocationDesc, LocationReq,
  LoreStoryCard,
} from './styles';

const WorldMapTab: React.FC = () => {
  const { data, userId, apiPost, showToast, fetchAll } = useGameFi();
  if (!data) return null;

  const { worldMap, lore } = data;

  const handleTravel = async (locId: string) => {
    try {
      const json = await apiPost('/world/travel', { userId, locationId: locId });
      if (json.success) { showToast(json.data.message); await fetchAll(); }
    } catch (err) {
      console.error('handleTravel failed', err);
      showToast('❌ Không thể di chuyển');
    }
  };

  return (
    <>
      <SectionTitle>🗺️ Thế Giới Nội Tâm — Bản Đồ Tâm Lý</SectionTitle>
      <div style={{color:'#888',marginBottom:'1rem',fontSize:'0.9rem'}}>
        Đã mở khóa {worldMap.unlockedCount}/{worldMap.totalCount} vùng đất
      </div>
      <Grid cols="300px">
        {worldMap.locations.map(loc => (
          <LocationCard key={loc.id} unlocked={loc.unlocked} current={loc.isCurrent}
            onClick={() => loc.unlocked && !loc.isCurrent && handleTravel(loc.id)}>
            <LocationIcon>{LOCATION_ICONS[loc.id] || '🏔️'}</LocationIcon>
            <LocationName>{loc.ten} {loc.isCurrent && '📍'}</LocationName>
            <LocationDesc>{loc.moTa}</LocationDesc>
            <LocationReq>
              {loc.unlocked
                ? loc.isCurrent ? '📍 Bạn đang ở đây' : '✅ Đã mở — Nhấn để đi đến'
                : `🔒 Cần Level ${loc.levelRequired} & Growth ${loc.growthScoreRequired}`}
            </LocationReq>
          </LocationCard>
        ))}
      </Grid>

      {/* Location Lore */}
      <SectionTitle>📖 Truyền Thuyết Vùng Đất</SectionTitle>
      {lore.locationLores.map(ll => {
        const loc = worldMap.locations.find(l => l.id === ll.locationId);
        return (
          <LoreStoryCard key={ll.locationId} style={{opacity: loc?.unlocked ? 1 : 0.5}}>
            <h3 style={{color:'#4A4A4A',marginBottom:'0.5rem'}}>{LOCATION_ICONS[ll.locationId] || '🏔️'} {ll.ten}</h3>
            <p style={{color:'#666',lineHeight:1.6,marginBottom:'0.75rem'}}>{loc?.unlocked ? ll.truyenThuyet : '🔒 Mở khóa vùng đất để đọc truyền thuyết'}</p>
            {loc?.unlocked && <p style={{fontStyle:'italic',color:'#805AD5',fontSize:'0.9rem'}}>💬 "{ll.trieuLy}"</p>}
          </LoreStoryCard>
        );
      })}
    </>
  );
};

export default WorldMapTab;
