/**
 * GameFi — Shared Styled Components
 */

import styled, { keyframes, css } from 'styled-components';

export const fadeIn = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
export const pulse = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(1.05)}`;

export const Container = styled.div`max-width:1200px;margin:0 auto;padding:1.5rem;animation:${fadeIn} 0.5s ease-out;`;

export const UserBar = styled.div`display:flex;align-items:center;justify-content:space-between;background:white;border-radius:16px;padding:1rem 1.5rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);margin-bottom:1.5rem;`;
export const UserInfo = styled.div`display:flex;align-items:center;gap:0.75rem;`;
export const UserAvatar = styled.div`width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:white;`;
export const UserName = styled.span`font-weight:600;color:#4A4A4A;`;
export const ArchetypeTag = styled.span`display:inline-block;background:linear-gradient(135deg,#805AD5,#6B46C1);color:white;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;margin-left:0.5rem;`;
export const LogoutBtn = styled.button`background:none;border:1px solid #E8E8E8;border-radius:8px;padding:0.4rem 1rem;color:#888;font-size:0.85rem;cursor:pointer;transition:all 0.2s;&:hover{border-color:#E8B4B8;color:#E8B4B8;}`;

export const TabBar = styled.div`display:flex;gap:0.5rem;background:white;border-radius:16px;padding:0.5rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);margin-bottom:1.5rem;overflow-x:auto;`;
export const Tab = styled.button<{active?:boolean}>`padding:0.6rem 1.2rem;border:none;border-radius:12px;font-size:0.85rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all 0.2s;background:${p=>p.active?'linear-gradient(135deg,#E8B4B8,#D4A5A5)':'transparent'};color:${p=>p.active?'white':'#888'};&:hover{background:${p=>p.active?'linear-gradient(135deg,#E8B4B8,#D4A5A5)':'#F5F5F5'};}`;

export const Card = styled.div<{active?:boolean}>`background:${p=>p.active?'linear-gradient(135deg,#FFF5F5,#F5F0FF)':'white'};border-radius:16px;padding:1.25rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);transition:all 0.2s;`;
export const Grid = styled.div<{cols?:string}>`display:grid;grid-template-columns:repeat(auto-fit,minmax(${p=>p.cols||'280px'},1fr));gap:1rem;margin-bottom:1.5rem;`;

export const SectionTitle = styled.h2`font-size:1.3rem;color:#4A4A4A;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;`;
export const SubTitle = styled.h3`font-size:1.05rem;color:#4A4A4A;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;`;

export const StatsRow = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;`;
export const StatCard = styled.div<{color?:string}>`background:white;border-radius:16px;padding:1.25rem;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.06);border-left:4px solid ${p=>p.color||'#E8B4B8'};`;
export const StatValue = styled.div`font-size:2rem;font-weight:700;color:#4A4A4A;`;
export const StatLabel = styled.div`font-size:0.82rem;color:#888;margin-top:0.25rem;`;

export const PointsRow = styled.div`display:flex;gap:1rem;margin-bottom:1.5rem;`;
export const PointCard = styled.div<{gradient:string}>`flex:1;background:${p=>p.gradient};border-radius:16px;padding:1rem 1.25rem;color:white;text-align:center;`;
export const PointValue = styled.div`font-size:1.5rem;font-weight:700;`;
export const PointLabel = styled.div`font-size:0.8rem;opacity:0.9;margin-top:0.25rem;`;

export const BarBg = styled.div`background:#F0F0F0;border-radius:8px;height:10px;overflow:hidden;`;
export const BarFill = styled.div<{w:number;color:string}>`height:100%;width:${p=>Math.min(100,p.w)}%;background:${p=>p.color};border-radius:8px;transition:width 0.6s ease;`;
export const XpBarBg = styled.div`background:#F0F0F0;border-radius:8px;height:8px;margin-top:0.5rem;overflow:hidden;`;
export const XpBarFill = styled.div<{w:number}>`height:100%;width:${p=>p.w}%;background:linear-gradient(90deg,#E8B4B8,#D4A5A5);border-radius:8px;transition:width 0.6s ease;`;

export const QuestCard = styled.div<{done?:boolean}>`background:${p=>p.done?'#F0FFF4':'white'};border-radius:16px;padding:1.25rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);border:2px solid ${p=>p.done?'#48BB78':'transparent'};transition:all 0.2s;cursor:pointer;&:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.1);}`;
export const QuestIcon = styled.div`font-size:2rem;margin-bottom:0.5rem;`;
export const QuestTitle = styled.h3`font-size:1rem;color:#4A4A4A;margin-bottom:0.25rem;`;
export const QuestDesc = styled.p`font-size:0.85rem;color:#888;margin-bottom:0.75rem;line-height:1.4;`;
export const QuestReward = styled.span`font-size:0.8rem;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);color:white;padding:0.25rem 0.75rem;border-radius:20px;font-weight:600;`;
export const QuestStatus = styled.span<{done?:boolean}>`font-size:0.8rem;color:${p=>p.done?'#48BB78':'#888'};font-weight:600;margin-left:0.5rem;`;

export const BadgeGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:1rem;margin-bottom:1.5rem;`;
export const BadgeCard = styled.div<{unlocked?:boolean}>`background:${p=>p.unlocked?'white':'#F5F5F5'};border-radius:16px;padding:1.25rem;text-align:center;box-shadow:${p=>p.unlocked?'0 4px 15px rgba(232,180,184,0.2)':'none'};opacity:${p=>p.unlocked?1:0.5};transition:all 0.2s;${p=>p.unlocked?css`animation:${pulse} 2s ease-in-out infinite;`:''};`;
export const BadgeIcon = styled.div`font-size:2.5rem;margin-bottom:0.5rem;`;
export const BadgeName = styled.div`font-size:0.8rem;font-weight:600;color:#4A4A4A;`;
export const BadgeStatus = styled.div`font-size:0.7rem;color:#888;margin-top:0.25rem;`;

export const SkillBranch = styled.div`margin-bottom:1.5rem;`;
export const BranchHeader = styled.div<{mastered?:boolean}>`display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:${p=>p.mastered?'linear-gradient(135deg,#F0FFF4,#E6FFFA)':'#F7FAFC'};border-radius:12px;margin-bottom:0.75rem;`;
export const SkillNode = styled.div<{unlocked?:boolean;canUnlock?:boolean}>`display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:${p=>p.unlocked?'#F0FFF4':p.canUnlock?'#FFFFF0':'white'};border-radius:12px;border:2px solid ${p=>p.unlocked?'#48BB78':p.canUnlock?'#ECC94B':'#E2E8F0'};margin-bottom:0.5rem;`;
export const SkillTier = styled.div<{unlocked?:boolean}>`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;background:${p=>p.unlocked?'#48BB78':'#E2E8F0'};color:${p=>p.unlocked?'white':'#A0AEC0'};`;

export const LocationCard = styled.div<{unlocked?:boolean;current?:boolean}>`background:${p=>p.current?'linear-gradient(135deg,#FFF5F5,#F5F0FF)':p.unlocked?'white':'#F5F5F5'};border-radius:16px;padding:1.5rem;box-shadow:${p=>p.unlocked?'0 4px 15px rgba(0,0,0,0.06)':'none'};border:2px solid ${p=>p.current?'#805AD5':p.unlocked?'#48BB78':'#E2E8F0'};opacity:${p=>p.unlocked?1:0.6};cursor:${p=>p.unlocked?'pointer':'default'};transition:all 0.2s;&:hover{${p=>p.unlocked?'transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.1);':''}}`;
export const LocationIcon = styled.div`font-size:2.5rem;margin-bottom:0.5rem;`;
export const LocationName = styled.h3`font-size:1.1rem;color:#4A4A4A;margin-bottom:0.25rem;`;
export const LocationDesc = styled.p`font-size:0.85rem;color:#888;line-height:1.4;`;
export const LocationReq = styled.div`font-size:0.75rem;color:#A0AEC0;margin-top:0.5rem;`;

export const PhilosophyCard = styled.div`background:linear-gradient(135deg,#667eea15,#764ba215);border-radius:16px;padding:1.5rem;margin-bottom:1rem;border-left:4px solid #805AD5;`;
export const LegendCard = styled.div`background:white;border-radius:16px;padding:1.5rem;box-shadow:0 4px 15px rgba(0,0,0,0.06);margin-bottom:1rem;`;
export const LoreStoryCard = styled.div`background:linear-gradient(135deg,#FFF5F5,#FFFAF0);border-radius:16px;padding:1.5rem;margin-bottom:1rem;border-left:4px solid #E8B4B8;`;

export const RitualStep = styled.div<{done?:boolean}>`display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:${p=>p.done?'#F0FFF4':'white'};border-radius:12px;border:2px solid ${p=>p.done?'#48BB78':'#E2E8F0'};margin-bottom:0.5rem;cursor:pointer;transition:all 0.2s;&:hover{border-color:${p=>p.done?'#48BB78':'#E8B4B8'};}`;

export const RecommendCard = styled.div`background:linear-gradient(135deg,#667eea08,#764ba208);border-radius:16px;padding:1.25rem;border:2px solid #805AD530;margin-bottom:1rem;cursor:pointer;transition:all 0.2s;&:hover{border-color:#805AD5;transform:translateY(-2px);}`;
export const ChainCard = styled.div`background:linear-gradient(135deg,#FFF5F5 0%,#F5F0FF 50%,#F0F7FF 100%);border-radius:20px;padding:1.75rem;border:2px solid #E8B4B850;margin-bottom:1.5rem;box-shadow:0 4px 20px rgba(128,90,213,0.08);position:relative;overflow:hidden;&::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#E8B4B8,#805AD5,#667eea);border-radius:20px 20px 0 0;}`;

export const CatTabs = styled.div`display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;`;
export const CatTab = styled.button<{active?:boolean}>`padding:0.4rem 0.9rem;border:1.5px solid ${p=>p.active?'#805AD5':'#E2E8F0'};border-radius:20px;font-size:0.8rem;font-weight:600;cursor:pointer;background:${p=>p.active?'#805AD510':'white'};color:${p=>p.active?'#805AD5':'#888'};transition:all 0.2s;&:hover{border-color:#805AD5;color:#805AD5;}`;
export const QuestBrowserCard = styled.div<{done?:boolean}>`background:${p=>p.done?'#F0FFF4':'white'};border-radius:12px;padding:1rem 1.25rem;border:1.5px solid ${p=>p.done?'#48BB78':'#E2E8F0'};margin-bottom:0.5rem;cursor:pointer;transition:all 0.2s;display:flex;justify-content:space-between;align-items:center;&:hover{border-color:#805AD5;transform:translateX(4px);}`;
export const QuestBrowserInfo = styled.div`flex:1;min-width:0;`;
export const QuestBrowserTitle = styled.div`font-weight:600;color:#4A4A4A;font-size:0.9rem;`;
export const QuestBrowserMeta = styled.div`display:flex;gap:0.5rem;margin-top:0.3rem;flex-wrap:wrap;`;
export const MetaTag = styled.span<{color?:string}>`font-size:0.72rem;padding:0.15rem 0.5rem;border-radius:12px;background:${p=>p.color||'#F7FAFC'};color:#666;font-weight:500;`;
export const QuestDbStats = styled.div`display:flex;gap:1.5rem;margin-bottom:1rem;font-size:0.85rem;color:#888;`;
export const FilterRow = styled.div`display:flex;gap:0.75rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap;`;
export const SelectBox = styled.select`padding:0.35rem 0.7rem;border:1.5px solid #E2E8F0;border-radius:10px;font-size:0.82rem;color:#4A4A4A;background:white;cursor:pointer;outline:none;&:focus{border-color:#805AD5;}`;
export const QuestDetailPanel = styled.div`padding:0.75rem 0 0 0;border-top:1px solid #E2E8F0;margin-top:0.75rem;`;
export const GrowthBar = styled.div<{w:number;color:string}>`height:6px;border-radius:3px;background:#F0F0F0;position:relative;overflow:hidden;&::after{content:'';position:absolute;left:0;top:0;height:100%;width:${p=>Math.min(100, p.w*25)}%;background:${p=>p.color};border-radius:3px;transition:width 0.4s;}`;
export const ChainStep = styled.div<{idx:number; done?:boolean; active?:boolean; locked?:boolean}>`display:flex;align-items:flex-start;gap:1rem;padding:0.85rem 1rem;margin:0.25rem 0;border-radius:14px;position:relative;transition:all 0.3s ease;${p => p.done ? `background:#F0FFF4;border:1.5px solid #48BB7840;` : p.active ? `background:linear-gradient(135deg,#805AD508,#E8B4B815);border:2px solid #805AD560;box-shadow:0 0 16px rgba(128,90,213,0.12);` : `background:#F7FAFC80;border:1.5px solid #E2E8F040;opacity:0.55;`}`;
export const ChainProgressBar = styled.div`background:#E2E8F0;border-radius:8px;height:6px;margin:0.75rem 0 1.25rem;overflow:hidden;`;
export const ChainProgressFill = styled.div<{pct:number}>`height:100%;border-radius:8px;background:linear-gradient(90deg,#48BB78,#805AD5,#667eea);width:${p => p.pct}%;transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1);`;
export const StepNumber = styled.div<{done?:boolean; active?:boolean; locked?:boolean}>`width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;flex-shrink:0;transition:all 0.3s;${p => p.done ? `background:#48BB78;color:white;box-shadow:0 2px 8px rgba(72,187,120,0.3);` : p.active ? `background:linear-gradient(135deg,#805AD5,#667eea);color:white;box-shadow:0 0 12px rgba(128,90,213,0.4);animation:stepPulse 2s ease-in-out infinite;` : `background:#E2E8F0;color:#A0AEC0;`}@keyframes stepPulse{0%,100%{box-shadow:0 0 12px rgba(128,90,213,0.4);}50%{box-shadow:0 0 20px rgba(128,90,213,0.6);}}`;

export const ZoneBadge = styled.span<{zone:string}>`display:inline-block;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.8rem;font-weight:600;color:white;background:${p=>{const m:Record<string,string>={disorientation:'#E53E3E',self_exploration:'#DD6B20',stabilization:'#ECC94B',growth:'#48BB78',mentor_stage:'#805AD5'};return m[p.zone]||'#888';}};`;

export const Toast = styled.div<{visible:boolean}>`position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#48BB78,#38A169);color:white;padding:1rem 1.5rem;border-radius:12px;box-shadow:0 8px 25px rgba(72,187,120,0.4);z-index:1000;opacity:${p=>p.visible?1:0};transform:translateY(${p=>p.visible?'0':'-20px'});transition:all 0.3s ease;font-weight:600;`;

export const Overlay = styled.div`position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:999;display:flex;align-items:center;justify-content:center;`;
export const ConfirmBox = styled.div`background:white;border-radius:16px;padding:2rem;max-width:400px;width:90%;box-shadow:0 20px 50px rgba(0,0,0,0.2);text-align:center;`;
export const ConfirmTitle = styled.h3`color:#4A4A4A;margin-bottom:0.5rem;font-size:1.1rem;`;
export const ConfirmDesc = styled.p`color:#888;font-size:0.9rem;margin-bottom:1.5rem;line-height:1.5;`;
export const ConfirmBtnRow = styled.div`display:flex;gap:0.75rem;justify-content:center;`;

export const LoadingContainer = styled.div`display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;color:#888;font-size:1.1rem;`;
export const ErrorContainer = styled.div`text-align:center;padding:2rem;color:#E53E3E;`;
export const RetryButton = styled.button`margin-top:1rem;padding:0.6rem 1.5rem;border:none;border-radius:8px;background:linear-gradient(135deg,#E8B4B8,#D4A5A5);color:white;font-weight:600;cursor:pointer;transition:all 0.2s;&:hover{transform:scale(1.05);}`;
export const ActionBtn = styled.button<{variant?:string}>`padding:0.5rem 1rem;border:none;border-radius:10px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;background:${p=>p.variant==='secondary'?'#F7FAFC':'linear-gradient(135deg,#E8B4B8,#D4A5A5)'};color:${p=>p.variant==='secondary'?'#4A4A4A':'white'};border:${p=>p.variant==='secondary'?'1px solid #E2E8F0':'none'};&:hover{transform:scale(1.03);}`;

// Onboarding
export const OnboardingOverlay = styled.div`position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;`;
export const OnboardingCard = styled.div`background:white;border-radius:20px;padding:2.5rem;max-width:520px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;animation:${fadeIn} 0.5s ease-out;`;
export const OnboardingSteps = styled.div`display:flex;gap:0.5rem;justify-content:center;margin:1.5rem 0;`;
export const OnboardingDot = styled.div<{active?:boolean}>`width:10px;height:10px;border-radius:50%;background:${p=>p.active?'#805AD5':'#E2E8F0'};transition:all 0.3s;`;

/* Reward Overlay */
const levelUpGlow = keyframes`0%,100%{box-shadow:0 0 20px rgba(128,90,213,0.3)}50%{box-shadow:0 0 40px rgba(128,90,213,0.6)}`;
const celebratePop = keyframes`0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}`;

export const RewardOverlay = styled.div`position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1001;display:flex;align-items:center;justify-content:center;animation:${fadeIn} 0.2s ease-out;`;
export const RewardCard = styled.div<{levelUp?:boolean}>`background:white;border-radius:20px;padding:2rem;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.25);text-align:center;animation:${celebratePop} 0.4s ease-out;${p=>p.levelUp?css`animation:${celebratePop} 0.4s ease-out,${levelUpGlow} 2s ease-in-out infinite;border:2px solid #805AD5;`:''}` ;
export const RewardXp = styled.div`font-size:2.2rem;font-weight:800;background:linear-gradient(135deg,#48BB78,#38A169);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0.5rem 0;`;
export const RewardMilestone = styled.div`background:linear-gradient(135deg,#805AD5,#6B46C1);color:white;padding:0.75rem 1.5rem;border-radius:16px;font-size:1rem;font-weight:700;margin:0.75rem 0;display:inline-block;`;
export const RewardStatRow = styled.div`display:flex;align-items:center;gap:0.5rem;justify-content:center;font-size:0.85rem;color:#4A4A4A;padding:0.2rem 0;`;
export const RewardPointsRow = styled.div`display:flex;gap:1rem;justify-content:center;margin:0.75rem 0;`;
export const RewardPointBadge = styled.span<{color:string}>`font-size:0.82rem;font-weight:600;padding:0.3rem 0.8rem;border-radius:20px;background:${p=>p.color};color:white;`;
export const RewardDismissBtn = styled.button`margin-top:1rem;padding:0.5rem 1.5rem;border:none;border-radius:10px;background:#F7FAFC;color:#888;font-size:0.85rem;cursor:pointer;transition:all 0.2s;&:hover{background:#E2E8F0;}`;
