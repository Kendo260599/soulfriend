/**
 * LoreTab — World philosophy, legends
 */

import React from 'react';
import { useGameFi } from './GameFiContext';
import {
  SectionTitle, SubTitle, Grid,
  PhilosophyCard, LegendCard,
} from './styles';

const LoreTab: React.FC = () => {
  const { data } = useGameFi();
  if (!data) return null;

  const { lore } = data;

  return (
    <>
      <SectionTitle>📜 {lore.worldName}</SectionTitle>
      <div style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>
        Vai trò: <strong>{lore.playerRole}</strong> • Cộng đồng: <strong>{lore.communityName}</strong>
      </div>

      {/* Philosophies */}
      <SubTitle>🌟 Triết Lý Thế Giới</SubTitle>
      {lore.philosophies.map(p => (
        <PhilosophyCard key={p.id}>
          <p style={{color:'#4A4A4A',lineHeight:1.6,fontStyle:'italic',fontSize:'1rem'}}>"{p.noiDung}"</p>
        </PhilosophyCard>
      ))}

      {/* Legends */}
      <SubTitle style={{marginTop:'1.5rem'}}>⚔️ Nhân Vật Huyền Thoại</SubTitle>
      <Grid cols="280px">
        {lore.legends.map(leg => (
          <LegendCard key={leg.id}>
            <h4 style={{color:'#805AD5',marginBottom:'0.5rem'}}>{leg.ten}</h4>
            <p style={{color:'#666',fontSize:'0.85rem',lineHeight:1.5,marginBottom:'0.5rem'}}>{leg.moTa}</p>
            <div style={{fontSize:'0.8rem',color:'#E8B4B8',fontWeight:600}}>🏆 {leg.becomeCondition}</div>
          </LegendCard>
        ))}
      </Grid>
    </>
  );
};

export default LoreTab;
