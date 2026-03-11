/**
 * SkillTreeTab — Branch skills, synergies, masteries
 */

import React from 'react';
import { useGameFi } from './GameFiContext';
import { BRANCH_CONFIG } from './config';
import {
  SectionTitle, Grid, Card,
  SkillBranch, BranchHeader, SkillNode, SkillTier,
} from './styles';

const SkillTreeTab: React.FC = () => {
  const { data } = useGameFi();
  if (!data) return null;

  const { skillTree } = data;
  const branches = Object.keys(BRANCH_CONFIG);

  return (
    <>
      <SectionTitle>🌳 Skill Tree — Cây Kỹ Năng Tâm Lý</SectionTitle>
      <div style={{color:'#888',marginBottom:'1rem',fontSize:'0.9rem'}}>
        Đã mở khóa {skillTree.unlockedCount}/{skillTree.totalCount} kỹ năng
      </div>

      {branches.map(branch => {
        const cfg = BRANCH_CONFIG[branch];
        const branchSkills = skillTree.skills.filter(s => s.branch === branch).sort((a,b) => a.tier - b.tier);
        const mastery = skillTree.masteries.find(m => m.branch === branch);
        return (
          <SkillBranch key={branch}>
            <BranchHeader mastered={mastery?.mastered}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'1.3rem'}}>{cfg.icon}</span>
                <strong style={{color:'#4A4A4A'}}>{cfg.name}</strong>
                {mastery?.mastered && <span style={{fontSize:'0.75rem',background:'#48BB78',color:'white',padding:'0.15rem 0.5rem',borderRadius:20}}>✅ {mastery.danhHieu}</span>}
              </div>
              <span style={{color:'#888',fontSize:'0.8rem'}}>{branchSkills.filter(s=>s.unlocked).length}/{branchSkills.length}</span>
            </BranchHeader>
            {branchSkills.map(skill => (
              <SkillNode key={skill.id} unlocked={skill.unlocked} canUnlock={skill.canUnlock}>
                <SkillTier unlocked={skill.unlocked}>{skill.tier}</SkillTier>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:'#4A4A4A',fontSize:'0.95rem'}}>{skill.ten}</div>
                  <div style={{color:'#888',fontSize:'0.8rem'}}>{skill.moTa}</div>
                </div>
                <div style={{fontSize:'0.75rem',color:skill.unlocked?'#48BB78':skill.canUnlock?'#ECC94B':'#A0AEC0',fontWeight:600}}>
                  {skill.unlocked ? '✅' : skill.canUnlock ? '🔓 Sẵn sàng' : '🔒'}
                </div>
              </SkillNode>
            ))}
          </SkillBranch>
        );
      })}

      {/* Synergies */}
      <SectionTitle>⚡ Synergies</SectionTitle>
      <Grid cols="250px">
        {skillTree.synergies.map(syn => (
          <Card key={syn.id} style={{opacity:syn.unlocked?1:0.5,borderLeft:`4px solid ${syn.unlocked?'#805AD5':'#E2E8F0'}`}}>
            <div style={{fontWeight:600,color:'#4A4A4A',marginBottom:'0.25rem'}}>{syn.unlocked?'⚡':'🔒'} {syn.ten}</div>
            <div style={{color:'#888',fontSize:'0.85rem'}}>{syn.moTa}</div>
          </Card>
        ))}
      </Grid>
    </>
  );
};

export default SkillTreeTab;
