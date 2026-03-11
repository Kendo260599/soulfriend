/**
 * QuestsTab — Adaptive AI quests, quest DB browser, history, growth impact
 * Owns local state: adaptive, questDb, questCat, questSort, questDoneFilter, expandedQuestId, questHistory
 * Fixes I2 (silent catches → console.error + showToast) and I5 (quest pagination)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useGameFi } from './GameFiContext';
import { API_URL, GROWTH_CONFIG, PHASE_NAMES, DIFF_LABELS, CATEGORY_LABELS } from './config';
import type { AdaptiveQuestData, QuestDbData, CompletionMode } from './types';
import {
  SectionTitle, SubTitle, Card, Grid,
  BarBg, BarFill, QuestReward, ActionBtn,
  RecommendCard, ChainCard, ChainStep, ChainProgressBar, ChainProgressFill, StepNumber,
  CatTabs, CatTab, FilterRow, SelectBox,
  QuestBrowserCard, QuestBrowserInfo, QuestBrowserTitle, QuestBrowserMeta, MetaTag,
  QuestDbStats, QuestDetailPanel,
  Overlay, ConfirmBox, ConfirmTitle, ConfirmDesc, ConfirmBtnRow,
} from './styles';
import JournalInputModal from './JournalInputModal';
import { resolveQuestSemantics } from './questSemanticRegistry';

const PAGE_SIZE = 20;

const QuestsTab: React.FC = () => {
  const { data, userId, authHeaders, apiPost, showToast, showReward, fetchAll } = useGameFi();

  const [adaptive, setAdaptive] = useState<AdaptiveQuestData | null>(null);
  const [questDb, setQuestDb] = useState<QuestDbData | null>(null);
  const [questCat, setQuestCat] = useState('all');
  const [questSort, setQuestSort] = useState<'recommended'|'xp_desc'|'xp_asc'>('recommended');
  const [questDoneFilter, setQuestDoneFilter] = useState<'all'|'todo'|'done'>('all');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [questHistory, setQuestHistory] = useState<{ questId: string; title: string; category: string; xpReward: number; completedAt: number }[]>([]);
  const [page, setPage] = useState(1);
  const [pendingQuest, setPendingQuest] = useState<{ id: string; title: string; description: string; mode: CompletionMode } | null>(null);

  const fetchAdaptive = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v2/gamefi/adaptive/${encodeURIComponent(userId)}`, { headers: authHeaders });
      if (res.ok) { const json = await res.json(); if (json.success) setAdaptive(json.data); }
    } catch (err) {
      console.error('fetchAdaptive failed', err);
    }
  }, [userId, authHeaders]);

  const fetchQuestDb = useCallback(async (category?: string, p = 1, limit = PAGE_SIZE) => {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      params.set('page', String(p));
      params.set('limit', String(limit));
      const res = await fetch(`${API_URL}/api/v2/gamefi/quests/${encodeURIComponent(userId)}?${params}`, { headers: authHeaders });
      if (res.ok) { const json = await res.json(); if (json.success) setQuestDb(json.data); }
    } catch (err) {
      console.error('fetchQuestDb failed', err);
    }
  }, [userId, authHeaders]);

  const fetchQuestHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v2/gamefi/history/${encodeURIComponent(userId)}`, { headers: authHeaders });
      if (res.ok) { const json = await res.json(); if (json.success) setQuestHistory(json.data); }
    } catch (err) {
      console.error('fetchQuestHistory failed', err);
    }
  }, [userId, authHeaders]);

  useEffect(() => { fetchAdaptive(); fetchQuestDb(); fetchQuestHistory(); }, [fetchAdaptive, fetchQuestDb, fetchQuestHistory]);
  useEffect(() => { setPage(1); fetchQuestDb(questCat, 1); }, [questCat, fetchQuestDb]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchQuestDb(questCat, newPage);
  };

  const handleFullQuestComplete = async (questId: string, title: string, journalText?: string) => {
    try {
      const json = await apiPost('/quests/complete', { userId, questId, ...(journalText ? { journalText } : {}) });
      if (json.success && json.data) { showReward(json.data, title); await fetchAll(); fetchQuestDb(questCat, page); fetchQuestHistory(); }
      else if (json.message) showToast(json.message);
    } catch (err) {
      console.error('handleFullQuestComplete failed', err);
      showToast('❌ Không thể hoàn thành quest');
    }
  };

  /** Gate quest completion by completionMode — never complete without user confirmation */
  const tryCompleteQuest = (questId: string, title: string, description: string, mode?: CompletionMode) => {
    const m = mode || 'manual_confirm';
    if (m === 'auto_event') {
      showToast('💡 Quest này hoàn thành tự động khi bạn thực hiện hành động tương ứng');
      return;
    }
    if (m === 'requires_input') {
      setPendingQuest({ id: questId, title, description, mode: m });
      return;
    }
    // manual_confirm, instant, or any unrecognized mode → confirm overlay
    setPendingQuest({ id: questId, title, description, mode: 'manual_confirm' });
  };

  const confirmPendingQuest = (journalText?: string) => {
    if (!pendingQuest) return;
    handleFullQuestComplete(pendingQuest.id, pendingQuest.title, journalText);
    setPendingQuest(null);
  };

  if (!data) return null;

  const totalPages = questDb ? Math.ceil(questDb.totalCount / PAGE_SIZE) : 1;

  return (
    <>
      <SectionTitle>🎯 Hệ Thống Nhiệm Vụ</SectionTitle>

      {/* Adaptive AI Recommendations */}
      {adaptive && (
        <>
          <SubTitle>🤖 AI Đề Xuất (Phase: {PHASE_NAMES[adaptive.playerPhase] || adaptive.playerPhase} • Type: {adaptive.userType})</SubTitle>
          <div style={{color:'#888',fontSize:'0.85rem',marginBottom:'0.75rem'}}>
            Độ khó: {DIFF_LABELS[adaptive.difficulty.current] || adaptive.difficulty.current} • Hoàn thành: {Math.round(adaptive.difficulty.completionRate*100)}%
            {adaptive.difficulty.shouldAdjust && <span style={{color:'#DD6B20'}}> • {adaptive.difficulty.reason}</span>}
          </div>
          {adaptive.difficulty.shouldAdjust && (
            <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
              {(['easy','medium','hard'] as const).map(d => (
                <ActionBtn key={d} style={{fontSize:'0.8rem',padding:'0.3rem 1rem',
                  background: adaptive.difficulty.current === d ? '#805AD5' : adaptive.difficulty.suggested === d ? '#E8B4B8' : '#E2E8F0',
                  color: adaptive.difficulty.current === d ? '#fff' : '#4A4A4A',
                }} onClick={() => showToast(`✅ Đã chọn độ khó: ${DIFF_LABELS[d] || d}`)}>
                  {DIFF_LABELS[d] || d} {adaptive.difficulty.suggested === d ? '⭐' : ''}
                </ActionBtn>
              ))}
            </div>
          )}

          {adaptive.recommendations.map(r => (
            <RecommendCard key={r.questId} onClick={() => tryCompleteQuest(r.questId, r.title, r.description, r.completionMode)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:600,color:'#4A4A4A'}}>{r.title}</div>
                  <div style={{color:'#888',fontSize:'0.85rem',marginTop:'0.25rem'}}>{r.description}</div>
                  <div style={{color:'#805AD5',fontSize:'0.8rem',marginTop:'0.25rem'}}>{r.reason}</div>
                </div>
                <QuestReward>+{r.xpReward} XP</QuestReward>
              </div>
            </RecommendCard>
          ))}

          {/* All Quest Chains — Journey Timeline */}
          {adaptive.allChains && adaptive.allChains.length > 0 && (
            <>
              <SubTitle style={{marginTop:'1.5rem'}}>🧭 Hành Trình Tâm Hồn ({adaptive.allChains.length} chuỗi)</SubTitle>
              {adaptive.allChains.map(chain => {
                const activeIdx = chain.steps.findIndex(s => !s.completed);
                const allDone = activeIdx === -1;
                const pct = chain.steps.length > 0 ? (chain.completedSteps / chain.steps.length) * 100 : 0;
                return (
                  <ChainCard key={chain.id}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
                      <SubTitle style={{margin:0}}>{allDone ? '🏆' : '🔗'} {chain.title}</SubTitle>
                      <span style={{color: allDone ? '#48BB78' : '#805AD5',fontWeight:600,fontSize:'0.85rem'}}>
                        {chain.completedSteps}/{chain.steps.length} bước • {chain.totalXp} XP
                      </span>
                    </div>
                    {allDone && (
                      <div style={{textAlign:'center',padding:'0.5rem 0 0.25rem',color:'#48BB78',fontWeight:600,fontSize:'0.85rem'}}>
                        ✨ Bạn đã hoàn thành chuỗi này! Thật tuyệt vời!
                      </div>
                    )}
                    <ChainProgressBar><ChainProgressFill pct={pct} /></ChainProgressBar>

                    <div style={{display:'flex',flexDirection:'column',gap:'0.35rem'}}>
                      {chain.steps.map((step, i) => {
                        const isDone = step.completed;
                        const isActive = i === activeIdx;
                        const isLocked = !isDone && !isActive;
                        return (
                          <React.Fragment key={i}>
                            {/* Connector line between steps */}
                            {i > 0 && (
                              <div style={{display:'flex',alignItems:'center',paddingLeft:'1.95rem'}}>
                                <div style={{width:'2px',height:'16px',background: isDone || isActive ? 'linear-gradient(to bottom,#48BB78,#805AD5)' : '#E2E8F0',borderRadius:'1px'}} />
                              </div>
                            )}
                            <ChainStep idx={i} done={isDone} active={isActive} locked={isLocked}>
                              <StepNumber done={isDone} active={isActive} locked={isLocked}>
                                {isDone ? '✓' : isLocked ? '🔒' : step.order}
                              </StepNumber>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:600,fontSize:'0.9rem',color: isDone ? '#48BB78' : isActive ? '#4A4A4A' : '#A0AEC0',textDecoration: isDone ? 'line-through' : 'none'}}>
                                  {step.title}
                                </div>
                                <div style={{color: isActive ? '#666' : '#A0AEC0',fontSize:'0.8rem',marginTop:'0.15rem'}}>
                                  {isLocked ? 'Hoàn thành bước trước để mở khóa' : step.description}
                                </div>
                                <div style={{fontSize:'0.75rem',marginTop:'0.25rem',color: isDone ? '#48BB7880' : isActive ? '#805AD5' : '#CBD5E0'}}>
                                  {isDone ? '✅ Đã nhận' : `+${step.xpReward} XP`}
                                </div>
                              </div>
                              {isActive && (
                                <ActionBtn style={{fontSize:'0.75rem',padding:'0.35rem 0.9rem',boxShadow:'0 2px 8px rgba(128,90,213,0.2)'}} onClick={() => tryCompleteQuest(`${chain.id}_step_${step.order}`, `${chain.title} - ${step.title}`, step.description, step.completionMode)}>
                                  ▶ Bắt đầu
                                </ActionBtn>
                              )}
                            </ChainStep>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </ChainCard>
                );
              })}
            </>
          )}
        </>
      )}

      {!adaptive && <div style={{color:'#888',marginBottom:'1rem'}}>Đang tải gợi ý AI...</div>}

      {/* Quest Database Browser */}
      <SectionTitle style={{marginTop:'2rem'}}>📚 Kho Nhiệm Vụ</SectionTitle>

      {questDb && (
        <>
          <QuestDbStats>
            <span>📊 {questDb.completedCount}/{questDb.totalCount} đã hoàn thành</span>
            <span>🏷️ {questDb.categories.length} chủ đề</span>
          </QuestDbStats>

          <CatTabs>
            <CatTab active={questCat === 'all'} onClick={() => setQuestCat('all')}>Tất cả</CatTab>
            {questDb.categories.map(c => (
              <CatTab key={c} active={questCat === c} onClick={() => setQuestCat(c)}>
                {CATEGORY_LABELS[c] || c}
              </CatTab>
            ))}
          </CatTabs>

          <FilterRow>
            <SelectBox value={questSort} onChange={e => setQuestSort(e.target.value as 'recommended'|'xp_desc'|'xp_asc')}>
              <option value="recommended">Đề xuất</option>
              <option value="xp_desc">XP cao → thấp</option>
              <option value="xp_asc">XP thấp → cao</option>
            </SelectBox>
            <SelectBox value={questDoneFilter} onChange={e => setQuestDoneFilter(e.target.value as 'all'|'todo'|'done')}>
              <option value="all">Tất cả</option>
              <option value="todo">Chưa làm</option>
              <option value="done">Đã hoàn thành</option>
            </SelectBox>
          </FilterRow>

          {(() => {
            let filtered = questDb.quests.filter(q =>
              questDoneFilter === 'all' ? true : questDoneFilter === 'done' ? q.completed : !q.completed
            );
            if (questSort === 'xp_desc') filtered = [...filtered].sort((a, b) => b.xpReward - a.xpReward);
            else if (questSort === 'xp_asc') filtered = [...filtered].sort((a, b) => a.xpReward - b.xpReward);
            return filtered.length > 0 ? filtered.map(q => (
              <QuestBrowserCard key={q.id} done={q.completed} onClick={() => setExpandedQuestId(prev => prev === q.id ? null : q.id)}>
                <QuestBrowserInfo>
                  <QuestBrowserTitle>{q.completed ? '✅ ' : ''}{q.title}</QuestBrowserTitle>
                  <div style={{color:'#888',fontSize:'0.82rem',marginTop:'0.2rem'}}>{q.description}</div>
                  <QuestBrowserMeta>
                    <MetaTag color="#F0E6FF">{CATEGORY_LABELS[q.category] || q.category}</MetaTag>
                    <MetaTag color="#E6F7FF">{q.location}</MetaTag>
                    <MetaTag color="#FFF5E6">{q.loai}</MetaTag>
                  </QuestBrowserMeta>
                  {expandedQuestId === q.id && (
                    <QuestDetailPanel>
                      <div style={{fontSize:'0.82rem',color:'#666',marginBottom:'0.5rem'}}>📍 Vùng đất: <strong>{q.location}</strong> • Loại: <strong>{q.loai}</strong></div>
                      {!q.completed && (
                        <ActionBtn onClick={e => { e.stopPropagation(); tryCompleteQuest(q.id, q.title, q.description, q.completionMode); }}>
                          ✨ Hoàn thành quest (+{q.xpReward} XP)
                        </ActionBtn>
                      )}
                    </QuestDetailPanel>
                  )}
                </QuestBrowserInfo>
                <QuestReward>+{q.xpReward} XP</QuestReward>
              </QuestBrowserCard>
            )) : <div style={{color:'#888',textAlign:'center',padding:'2rem'}}>Không có quest nào phù hợp</div>;
          })()}

          {/* I5: Pagination Controls */}
          {totalPages > 1 && (
            <div style={{display:'flex',justifyContent:'center',gap:'0.5rem',marginTop:'1rem'}}>
              <ActionBtn variant="secondary" onClick={() => handlePageChange(page - 1)} style={{visibility: page > 1 ? 'visible' : 'hidden'}}>
                ← Trước
              </ActionBtn>
              <span style={{padding:'0.5rem 1rem',color:'#888',fontSize:'0.85rem'}}>
                Trang {page}/{totalPages}
              </span>
              <ActionBtn variant="secondary" onClick={() => handlePageChange(page + 1)} style={{visibility: page < totalPages ? 'visible' : 'hidden'}}>
                Sau →
              </ActionBtn>
            </div>
          )}
        </>
      )}

      {!questDb && <div style={{color:'#888'}}>Đang tải kho nhiệm vụ...</div>}

      {/* Quest Completion History */}
      {questHistory.length > 0 && (
        <>
          <SectionTitle style={{marginTop:'2rem'}}>📜 Lịch Sử Hoàn Thành ({questHistory.length})</SectionTitle>
          <div style={{maxHeight:'300px',overflowY:'auto'}}>
            {questHistory.slice(0, 20).map((h, i) => (
              <Card key={`${h.questId}-${i}`} style={{padding:'0.7rem 1rem',marginBottom:'0.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:'0.9rem',color:'#4A4A4A'}}>✅ {h.title}</div>
                  <div style={{color:'#888',fontSize:'0.78rem'}}>
                    {CATEGORY_LABELS[h.category] || h.category}
                    {h.completedAt > 0 && ` • ${new Date(h.completedAt).toLocaleDateString('vi-VN')}`}
                  </div>
                </div>
                <QuestReward>+{h.xpReward} XP</QuestReward>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Growth Impact */}
      {data && (
        <>
          <SectionTitle style={{marginTop:'2rem'}}>🌱 Tác Động Phát Triển</SectionTitle>
          <Card>
            <div style={{fontSize:'0.85rem',color:'#888',marginBottom:'1rem'}}>
              📊 {data.profile.character.completedQuestIds.length} quest hoàn thành → Chỉ số phát triển hiện tại:
            </div>
            {GROWTH_CONFIG.map(({key, label, color, icon}) => (
              <div key={key} style={{marginBottom:'0.75rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.85rem',marginBottom:'0.25rem'}}>
                  <span>{icon} {label}</span>
                  <span style={{fontWeight:600,color}}>{data.profile.character.growthStats[key]}/100</span>
                </div>
                <BarBg><BarFill w={data.profile.character.growthStats[key]} color={color} /></BarBg>
              </div>
            ))}
            <div style={{textAlign:'center',marginTop:'1rem',padding:'0.75rem',background:'linear-gradient(135deg,#F0E6FF,#FFF5F5)',borderRadius:'12px'}}>
              <div style={{fontSize:'1.5rem',fontWeight:700,color:'#805AD5'}}>{data.state.growthScore}</div>
              <div style={{fontSize:'0.8rem',color:'#888'}}>Growth Score tổng hợp</div>
            </div>
          </Card>
        </>
      )}

      {/* Confirm modal for manual_confirm quests */}
      {pendingQuest && pendingQuest.mode !== 'requires_input' && (
        <Overlay onClick={() => setPendingQuest(null)}>
          <ConfirmBox onClick={e => e.stopPropagation()}>
            <ConfirmTitle>{pendingQuest.title}</ConfirmTitle>
            <ConfirmDesc>
              {pendingQuest.description}
              {`\nXác nhận bạn đã hoàn thành?`}
            </ConfirmDesc>
            <ConfirmBtnRow>
              <ActionBtn variant="secondary" onClick={() => setPendingQuest(null)}>Chưa làm</ActionBtn>
              <ActionBtn onClick={() => confirmPendingQuest()}>✅ Đã hoàn thành</ActionBtn>
            </ConfirmBtnRow>
          </ConfirmBox>
        </Overlay>
      )}

      {/* Journal input modal for requires_input quests */}
      {pendingQuest && pendingQuest.mode === 'requires_input' && (() => {
        const sem = resolveQuestSemantics({ completionMode: pendingQuest.mode });
        return (
          <JournalInputModal
            title={pendingQuest.title}
            description={pendingQuest.description}
            onSubmit={(text) => confirmPendingQuest(text)}
            onCancel={() => setPendingQuest(null)}
            minSentences={sem.validation.minSentences}
            maxLength={sem.validation.maxTextLength}
          />
        );
      })()}
    </>
  );
};

export default QuestsTab;
