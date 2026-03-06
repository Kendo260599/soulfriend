/**
 * MENTAL HEALTH KNOWLEDGE GRAPH
 * 
 * V5 Learning Pipeline — Module 8: Knowledge Graph
 * Cấu trúc tri thức sức khỏe tâm thần dạng đồ thị
 * Nodes: emotions, coping strategies, support resources, crisis signals
 * 
 * @module services/mentalHealthKnowledgeGraph
 * @version 5.0.0
 */

import { logger } from '../utils/logger';
import redisService from './redisService';

// ===========================
// NODE & EDGE TYPES
// ===========================

interface KGNode {
  id: string;
  type: 'emotion' | 'coping_strategy' | 'support_resource' | 'crisis_signal' | 'symptom' | 'condition' | 'life_event';
  name: string;
  nameVi: string; // Vietnamese name
  description: string;
  severity?: number; // 0-1 for emotions/signals
  metadata?: Record<string, any>;
}

interface KGEdge {
  from: string;
  to: string;
  relation: 'triggers' | 'alleviates' | 'escalates_to' | 'indicates' | 'recommended_for' | 'related_to' | 'precedes';
  weight: number; // 0-1 strength
  bidirectional: boolean;
}

// ===========================
// KNOWLEDGE GRAPH
// ===========================

class MentalHealthKnowledgeGraph {
  private nodes: Map<string, KGNode> = new Map();
  private edges: KGEdge[] = [];
  private adjacency: Map<string, KGEdge[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeGraph();
  }

  /**
   * Khởi tạo graph với tri thức nền tảng
   */
  private initializeGraph(): void {
    // ===== EMOTIONS =====
    this.addNode({ id: 'em_anxiety', type: 'emotion', name: 'Anxiety', nameVi: 'Lo âu', description: 'Trạng thái lo lắng, bất an', severity: 0.6 });
    this.addNode({ id: 'em_depression', type: 'emotion', name: 'Depression', nameVi: 'Trầm cảm', description: 'Trạng thái buồn bã, mất hứng thú kéo dài', severity: 0.7 });
    this.addNode({ id: 'em_stress', type: 'emotion', name: 'Stress', nameVi: 'Căng thẳng', description: 'Áp lực quá mức', severity: 0.5 });
    this.addNode({ id: 'em_anger', type: 'emotion', name: 'Anger', nameVi: 'Tức giận', description: 'Cảm xúc giận dữ, bực bội', severity: 0.5 });
    this.addNode({ id: 'em_loneliness', type: 'emotion', name: 'Loneliness', nameVi: 'Cô đơn', description: 'Cảm giác bị cô lập', severity: 0.6 });
    this.addNode({ id: 'em_fear', type: 'emotion', name: 'Fear', nameVi: 'Sợ hãi', description: 'Nỗi sợ hãi, ám ảnh', severity: 0.6 });
    this.addNode({ id: 'em_shame', type: 'emotion', name: 'Shame', nameVi: 'Xấu hổ', description: 'Cảm giác xấu hổ, tội lỗi', severity: 0.5 });
    this.addNode({ id: 'em_hopelessness', type: 'emotion', name: 'Hopelessness', nameVi: 'Tuyệt vọng', description: 'Mất hy vọng hoàn toàn', severity: 0.9 });
    this.addNode({ id: 'em_overwhelm', type: 'emotion', name: 'Overwhelm', nameVi: 'Quá tải', description: 'Cảm giác quá tải không thể chịu nổi', severity: 0.7 });
    this.addNode({ id: 'em_grief', type: 'emotion', name: 'Grief', nameVi: 'Đau buồn', description: 'Nỗi đau mất mát', severity: 0.7 });

    // ===== COPING STRATEGIES =====
    this.addNode({ id: 'cs_breathing', type: 'coping_strategy', name: 'Deep Breathing', nameVi: 'Thở sâu', description: 'Kỹ thuật thở 4-7-8 giúp giảm lo âu' });
    this.addNode({ id: 'cs_meditation', type: 'coping_strategy', name: 'Meditation', nameVi: 'Thiền định', description: 'Mindfulness meditation giảm stress' });
    this.addNode({ id: 'cs_journaling', type: 'coping_strategy', name: 'Journaling', nameVi: 'Viết nhật ký', description: 'Ghi chép suy nghĩ, cảm xúc' });
    this.addNode({ id: 'cs_exercise', type: 'coping_strategy', name: 'Exercise', nameVi: 'Tập thể dục', description: 'Vận động thể chất giảm cortisol' });
    this.addNode({ id: 'cs_social', type: 'coping_strategy', name: 'Social Connection', nameVi: 'Kết nối xã hội', description: 'Nói chuyện với người thân, bạn bè' });
    this.addNode({ id: 'cs_sleep', type: 'coping_strategy', name: 'Sleep Hygiene', nameVi: 'Vệ sinh giấc ngủ', description: 'Cải thiện chất lượng giấc ngủ' });
    this.addNode({ id: 'cs_grounding', type: 'coping_strategy', name: 'Grounding 5-4-3-2-1', nameVi: 'Kỹ thuật neo giữ', description: 'Kỹ thuật grounding 5 giác quan' });
    this.addNode({ id: 'cs_progressive_relaxation', type: 'coping_strategy', name: 'Progressive Relaxation', nameVi: 'Thư giãn cơ', description: 'Thư giãn cơ tuần tự (Progressive Muscle Relaxation)' });
    this.addNode({ id: 'cs_cognitive_reframe', type: 'coping_strategy', name: 'Cognitive Reframing', nameVi: 'Tái cấu trúc nhận thức', description: 'Thay đổi cách nhìn nhận tình huống' });

    // ===== SUPPORT RESOURCES =====
    this.addNode({ id: 'sr_hotline_1800599920', type: 'support_resource', name: 'Child Helpline', nameVi: 'Tổng đài 1800 599 920', description: 'Tổng đài bảo vệ trẻ em (miễn phí)', metadata: { phone: '1800599920', hours: '24/7' } });
    this.addNode({ id: 'sr_hotline_1800599100', type: 'support_resource', name: 'Mental Health Hotline', nameVi: 'Đường dây tâm lý 1800 599 100', description: 'Tư vấn tâm lý miễn phí', metadata: { phone: '1800599100' } });
    this.addNode({ id: 'sr_hospital', type: 'support_resource', name: 'Hospital', nameVi: 'Bệnh viện', description: 'Khám tâm thần tại bệnh viện', metadata: { type: 'emergency' } });
    this.addNode({ id: 'sr_therapist', type: 'support_resource', name: 'Therapist', nameVi: 'Chuyên gia tâm lý', description: 'Tham vấn / trị liệu tâm lý chuyên nghiệp' });
    this.addNode({ id: 'sr_support_group', type: 'support_resource', name: 'Support Group', nameVi: 'Nhóm hỗ trợ', description: 'Nhóm hỗ trợ đồng đẳng' });
    this.addNode({ id: 'sr_police_113', type: 'support_resource', name: 'Emergency 113', nameVi: 'Công an 113', description: 'Gọi 113 khi có nguy hiểm', metadata: { phone: '113', type: 'emergency' } });

    // ===== CRISIS SIGNALS =====
    this.addNode({ id: 'cr_suicidal_ideation', type: 'crisis_signal', name: 'Suicidal Ideation', nameVi: 'Ý định tự tử', description: 'Suy nghĩ về cái chết, muốn kết liễu', severity: 1.0 });
    this.addNode({ id: 'cr_self_harm', type: 'crisis_signal', name: 'Self Harm', nameVi: 'Tự hại', description: 'Hành vi tự gây thương tích', severity: 0.9 });
    this.addNode({ id: 'cr_substance_abuse', type: 'crisis_signal', name: 'Substance Abuse', nameVi: 'Lạm dụng chất', description: 'Sử dụng rượu/thuốc quá mức', severity: 0.7 });
    this.addNode({ id: 'cr_domestic_violence', type: 'crisis_signal', name: 'Domestic Violence', nameVi: 'Bạo lực gia đình', description: 'Bị bạo lực trong gia đình', severity: 0.9 });
    this.addNode({ id: 'cr_social_withdrawal', type: 'crisis_signal', name: 'Social Withdrawal', nameVi: 'Rút lui xã hội', description: 'Ngừng giao tiếp, cô lập hoàn toàn', severity: 0.7 });

    // ===== LIFE EVENTS (Vietnamese-specific) =====
    this.addNode({ id: 'le_postpartum', type: 'life_event', name: 'Postpartum', nameVi: 'Sau sinh', description: 'Giai đoạn mang thai và sau sinh' });
    this.addNode({ id: 'le_marriage_conflict', type: 'life_event', name: 'Marriage Conflict', nameVi: 'Mâu thuẫn hôn nhân', description: 'Xung đột trong hôn nhân' });
    this.addNode({ id: 'le_work_pressure', type: 'life_event', name: 'Work Pressure', nameVi: 'Áp lực công việc', description: 'Áp lực từ công việc' });
    this.addNode({ id: 'le_family_pressure', type: 'life_event', name: 'Family Pressure', nameVi: 'Áp lực gia đình', description: 'Áp lực từ nhà chồng, gia đình' });
    this.addNode({ id: 'le_financial_stress', type: 'life_event', name: 'Financial Stress', nameVi: 'Áp lực tài chính', description: 'Khó khăn tài chính' });

    // ===== CONDITIONS =====
    this.addNode({ id: 'co_gad', type: 'condition', name: 'Generalized Anxiety Disorder', nameVi: 'Rối loạn lo âu lan tỏa', description: 'GAD — lo âu dai dẳng nhiều lĩnh vực' });
    this.addNode({ id: 'co_mdd', type: 'condition', name: 'Major Depressive Disorder', nameVi: 'Rối loạn trầm cảm chủ yếu', description: 'MDD — trầm cảm nặng' });
    this.addNode({ id: 'co_ptsd', type: 'condition', name: 'PTSD', nameVi: 'Rối loạn stress sau sang chấn', description: 'PTSD — chấn thương tâm lý' });
    this.addNode({ id: 'co_ppd', type: 'condition', name: 'Postpartum Depression', nameVi: 'Trầm cảm sau sinh', description: 'PPD — trầm cảm sau sinh nở' });

    // ===== EDGES (RELATIONSHIPS) =====

    // Emotions → Coping Strategies
    this.addEdge({ from: 'em_anxiety', to: 'cs_breathing', relation: 'alleviates', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'em_anxiety', to: 'cs_grounding', relation: 'alleviates', weight: 0.85, bidirectional: false });
    this.addEdge({ from: 'em_anxiety', to: 'cs_meditation', relation: 'alleviates', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'em_depression', to: 'cs_exercise', relation: 'alleviates', weight: 0.85, bidirectional: false });
    this.addEdge({ from: 'em_depression', to: 'cs_social', relation: 'alleviates', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'em_depression', to: 'cs_journaling', relation: 'alleviates', weight: 0.7, bidirectional: false });
    this.addEdge({ from: 'em_stress', to: 'cs_progressive_relaxation', relation: 'alleviates', weight: 0.85, bidirectional: false });
    this.addEdge({ from: 'em_stress', to: 'cs_exercise', relation: 'alleviates', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'em_stress', to: 'cs_sleep', relation: 'alleviates', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'em_anger', to: 'cs_breathing', relation: 'alleviates', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'em_anger', to: 'cs_cognitive_reframe', relation: 'alleviates', weight: 0.75, bidirectional: false });
    this.addEdge({ from: 'em_loneliness', to: 'cs_social', relation: 'alleviates', weight: 0.95, bidirectional: false });
    this.addEdge({ from: 'em_overwhelm', to: 'cs_breathing', relation: 'alleviates', weight: 0.85, bidirectional: false });
    this.addEdge({ from: 'em_overwhelm', to: 'cs_grounding', relation: 'alleviates', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'em_fear', to: 'cs_grounding', relation: 'alleviates', weight: 0.85, bidirectional: false });
    this.addEdge({ from: 'em_grief', to: 'cs_journaling', relation: 'alleviates', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'em_grief', to: 'cs_social', relation: 'alleviates', weight: 0.75, bidirectional: false });
    this.addEdge({ from: 'em_shame', to: 'cs_cognitive_reframe', relation: 'alleviates', weight: 0.85, bidirectional: false });

    // Emotions → Crisis Signals (escalation paths)
    this.addEdge({ from: 'em_hopelessness', to: 'cr_suicidal_ideation', relation: 'escalates_to', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'em_depression', to: 'em_hopelessness', relation: 'escalates_to', weight: 0.6, bidirectional: false });
    this.addEdge({ from: 'em_anger', to: 'cr_self_harm', relation: 'escalates_to', weight: 0.4, bidirectional: false });
    this.addEdge({ from: 'em_overwhelm', to: 'cr_substance_abuse', relation: 'escalates_to', weight: 0.3, bidirectional: false });
    this.addEdge({ from: 'em_loneliness', to: 'cr_social_withdrawal', relation: 'escalates_to', weight: 0.5, bidirectional: false });

    // Crisis signals → Support resources
    this.addEdge({ from: 'cr_suicidal_ideation', to: 'sr_hotline_1800599920', relation: 'recommended_for', weight: 1.0, bidirectional: false });
    this.addEdge({ from: 'cr_suicidal_ideation', to: 'sr_hospital', relation: 'recommended_for', weight: 1.0, bidirectional: false });
    this.addEdge({ from: 'cr_suicidal_ideation', to: 'sr_police_113', relation: 'recommended_for', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'cr_self_harm', to: 'sr_therapist', relation: 'recommended_for', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'cr_self_harm', to: 'sr_hotline_1800599100', relation: 'recommended_for', weight: 0.85, bidirectional: false });
    this.addEdge({ from: 'cr_domestic_violence', to: 'sr_police_113', relation: 'recommended_for', weight: 1.0, bidirectional: false });
    this.addEdge({ from: 'cr_domestic_violence', to: 'sr_hotline_1800599920', relation: 'recommended_for', weight: 0.9, bidirectional: false });

    // Life events → Emotions
    this.addEdge({ from: 'le_postpartum', to: 'em_depression', relation: 'triggers', weight: 0.7, bidirectional: false });
    this.addEdge({ from: 'le_postpartum', to: 'em_anxiety', relation: 'triggers', weight: 0.6, bidirectional: false });
    this.addEdge({ from: 'le_postpartum', to: 'em_overwhelm', relation: 'triggers', weight: 0.65, bidirectional: false });
    this.addEdge({ from: 'le_marriage_conflict', to: 'em_anger', relation: 'triggers', weight: 0.7, bidirectional: false });
    this.addEdge({ from: 'le_marriage_conflict', to: 'em_loneliness', relation: 'triggers', weight: 0.6, bidirectional: false });
    this.addEdge({ from: 'le_work_pressure', to: 'em_stress', relation: 'triggers', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'le_family_pressure', to: 'em_stress', relation: 'triggers', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'le_family_pressure', to: 'em_shame', relation: 'triggers', weight: 0.5, bidirectional: false });
    this.addEdge({ from: 'le_financial_stress', to: 'em_anxiety', relation: 'triggers', weight: 0.8, bidirectional: false });

    // Emotions → Conditions
    this.addEdge({ from: 'em_anxiety', to: 'co_gad', relation: 'indicates', weight: 0.6, bidirectional: false });
    this.addEdge({ from: 'em_depression', to: 'co_mdd', relation: 'indicates', weight: 0.6, bidirectional: false });
    this.addEdge({ from: 'le_postpartum', to: 'co_ppd', relation: 'indicates', weight: 0.5, bidirectional: false });
    this.addEdge({ from: 'em_fear', to: 'co_ptsd', relation: 'indicates', weight: 0.4, bidirectional: false });

    // Conditions → Support resources
    this.addEdge({ from: 'co_gad', to: 'sr_therapist', relation: 'recommended_for', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'co_mdd', to: 'sr_therapist', relation: 'recommended_for', weight: 0.95, bidirectional: false });
    this.addEdge({ from: 'co_mdd', to: 'sr_hospital', relation: 'recommended_for', weight: 0.7, bidirectional: false });
    this.addEdge({ from: 'co_ppd', to: 'sr_therapist', relation: 'recommended_for', weight: 0.9, bidirectional: false });
    this.addEdge({ from: 'co_ppd', to: 'sr_support_group', relation: 'recommended_for', weight: 0.8, bidirectional: false });
    this.addEdge({ from: 'co_ptsd', to: 'sr_therapist', relation: 'recommended_for', weight: 0.95, bidirectional: false });

    this.initialized = true;
    logger.info(`[KnowledgeGraph] Initialized with ${this.nodes.size} nodes, ${this.edges.length} edges`);
  }

  // ===========================
  // QUERY API
  // ===========================

  /**
   * Tìm coping strategies phù hợp cho emotion
   */
  getCopingStrategies(emotionId: string): Array<{ strategy: KGNode; weight: number }> {
    const edges = this.getOutgoing(emotionId).filter(e => e.relation === 'alleviates');
    return edges
      .map(e => ({
        strategy: this.nodes.get(e.to)!,
        weight: e.weight,
      }))
      .filter(s => s.strategy)
      .sort((a, b) => b.weight - a.weight);
  }

  /**
   * Tìm support resources cho crisis signal
   */
  getSupportResources(signalId: string): Array<{ resource: KGNode; weight: number }> {
    const edges = this.getOutgoing(signalId).filter(e => e.relation === 'recommended_for');
    return edges
      .map(e => ({
        resource: this.nodes.get(e.to)!,
        weight: e.weight,
      }))
      .filter(r => r.resource)
      .sort((a, b) => b.weight - a.weight);
  }

  /**
   * Phát hiện escalation path từ emotion hiện tại
   */
  getEscalationRisks(emotionId: string): Array<{ target: KGNode; path: string[]; totalWeight: number }> {
    const risks: Array<{ target: KGNode; path: string[]; totalWeight: number }> = [];
    
    // BFS to find escalation paths
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[]; weight: number }> = [
      { nodeId: emotionId, path: [emotionId], weight: 1.0 },
    ];

    while (queue.length > 0) {
      const { nodeId, path, weight } = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const escalationEdges = this.getOutgoing(nodeId).filter(e => e.relation === 'escalates_to');
      for (const edge of escalationEdges) {
        const node = this.nodes.get(edge.to);
        if (node) {
          const newPath = [...path, edge.to];
          const newWeight = weight * edge.weight;
          risks.push({ target: node, path: newPath, totalWeight: newWeight });
          queue.push({ nodeId: edge.to, path: newPath, weight: newWeight });
        }
      }
    }

    return risks.sort((a, b) => b.totalWeight - a.totalWeight);
  }

  /**
   * Match user message tới nodes trong graph
   */
  matchMessage(message: string): KGNode[] {
    const lower = message.toLowerCase();
    const matched: KGNode[] = [];

    for (const [, node] of this.nodes) {
      if (
        lower.includes(node.nameVi.toLowerCase()) ||
        lower.includes(node.name.toLowerCase()) ||
        lower.includes(node.description.toLowerCase().split(' ').slice(0, 3).join(' '))
      ) {
        matched.push(node);
      }
    }

    return matched;
  }

  /**
   * Tạo AI context enrichment từ matched nodes
   */
  enrichContext(matchedNodes: KGNode[]): string {
    const lines: string[] = ['[Knowledge Graph Context]'];

    for (const node of matchedNodes) {
      lines.push(`- Detected: ${node.nameVi} (${node.type})`);

      if (node.type === 'emotion') {
        const strategies = this.getCopingStrategies(node.id);
        if (strategies.length) {
          lines.push(`  Suggested coping: ${strategies.map(s => s.strategy.nameVi).join(', ')}`);
        }
        const risks = this.getEscalationRisks(node.id);
        if (risks.length) {
          lines.push(`  Risk escalation: ${risks.map(r => r.target.nameVi).join(' → ')}`);
        }
      }

      if (node.type === 'crisis_signal') {
        const resources = this.getSupportResources(node.id);
        if (resources.length) {
          lines.push(`  Resources: ${resources.map(r => r.resource.nameVi).join(', ')}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Get full graph for visualization
   */
  getFullGraph(): { nodes: KGNode[]; edges: KGEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }

  /**
   * Get graph stats
   */
  getStats(): any {
    const nodeTypes: Record<string, number> = {};
    for (const [, node] of this.nodes) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
    }

    const relationTypes: Record<string, number> = {};
    for (const edge of this.edges) {
      relationTypes[edge.relation] = (relationTypes[edge.relation] || 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodeTypes,
      relationTypes,
    };
  }

  // ===== HELPERS =====

  private addNode(node: KGNode): void {
    this.nodes.set(node.id, node);
  }

  private addEdge(edge: KGEdge): void {
    this.edges.push(edge);
    if (!this.adjacency.has(edge.from)) this.adjacency.set(edge.from, []);
    this.adjacency.get(edge.from)!.push(edge);

    if (edge.bidirectional) {
      const reverse = { ...edge, from: edge.to, to: edge.from };
      this.edges.push(reverse);
      if (!this.adjacency.has(reverse.from)) this.adjacency.set(reverse.from, []);
      this.adjacency.get(reverse.from)!.push(reverse);
    }
  }

  private getOutgoing(nodeId: string): KGEdge[] {
    return this.adjacency.get(nodeId) || [];
  }
}

export const mentalHealthKnowledgeGraph = new MentalHealthKnowledgeGraph();
export default mentalHealthKnowledgeGraph;
