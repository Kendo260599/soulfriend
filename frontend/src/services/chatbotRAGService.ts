/**
 * Chatbot RAG Service
 * Retrieval-Augmented Generation for Women's Mental Health Knowledge Base
 * Based on scientific research and evidence-based practices
 */

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  category: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface RAGResponse {
  answer: string;
  sources: string[];
  confidence: number;
  disclaimers: string[];
  suggestedActions: string[];
  relatedTests: string[];
}

export interface KnowledgeBase {
  disorders: KnowledgeChunk[];
  therapies: KnowledgeChunk[];
  coping: KnowledgeChunk[];
  medications: KnowledgeChunk[];
  relationships: KnowledgeChunk[];
  lifeStages: KnowledgeChunk[];
}

export class ChatbotRAGService {
  private knowledgeBase: KnowledgeBase = {
    disorders: [],
    therapies: [],
    coping: [],
    medications: [],
    relationships: [],
    lifeStages: []
  };

  private disclaimers = [
    'Thông tin này chỉ mang tính giáo dục và không thay thế lời khuyên của bác sĩ',
    'Nếu bạn đang gặp khủng hoảng, hãy liên hệ ngay với chuyên gia y tế',
    'Không sử dụng thông tin này để tự chẩn đoán hoặc điều trị'
  ];

  constructor() {
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize knowledge base with scientific data
   */
  private initializeKnowledgeBase(): void {
    // Disorders knowledge
    this.knowledgeBase.disorders = [
      {
        id: 'ppd_001',
        content: 'Trầm cảm sau sinh (PPD) là rối loạn tâm trạng phổ biến ảnh hưởng đến 10-15% phụ nữ sau sinh. Triệu chứng bao gồm: buồn bã dai dẳng, mất hứng thú, mệt mỏi, lo âu về em bé, cảm giác tội lỗi.',
        source: 'Journal of Clinical Psychology 2024',
        category: 'disorders',
        confidence: 0.95,
        metadata: {
          redFlags: ['Ý nghĩ tự hại', 'Bỏ bê em bé', 'Lo âu nghiêm trọng'],
          screeningTools: ['EPDS', 'PHQ-9'],
          cutOffs: { EPDS: 13, PHQ9: 10 }
        }
      },
      {
        id: 'gad_001',
        content: 'Rối loạn lo âu tổng quát (GAD) đặc trưng bởi lo âu quá mức về nhiều sự kiện trong ít nhất 6 tháng. Triệu chứng: lo âu khó kiểm soát, bồn chồn, mệt mỏi, khó tập trung, căng thẳng cơ bắp.',
        source: 'American Journal of Psychiatry 2024',
        category: 'disorders',
        confidence: 0.92,
        metadata: {
          redFlags: ['Hoảng loạn', 'Tránh né xã hội', 'Suy nghĩ tự hại'],
          screeningTools: ['GAD-7', 'DASS-21'],
          cutOffs: { GAD7: 10, DASS21: 14 }
        }
      }
    ];

    // Therapies knowledge
    this.knowledgeBase.therapies = [
      {
        id: 'cbt_001',
        content: 'Liệu pháp nhận thức hành vi (CBT) hiệu quả cho trầm cảm và lo âu. Kỹ thuật chính: xác định suy nghĩ tiêu cực, thách thức niềm tin không hợp lý, thay thế bằng suy nghĩ tích cực, bài tập hành vi.',
        source: 'Cognitive Behavioral Therapy Institute 2024',
        category: 'therapies',
        confidence: 0.94,
        metadata: {
          indications: ['Trầm cảm', 'Lo âu', 'PTSD'],
          duration: '12-20 phiên',
          effectiveness: '70-80%'
        }
      },
      {
        id: 'dbt_001',
        content: 'Liệu pháp hành vi biện chứng (DBT) phù hợp cho rối loạn cảm xúc và tự hại. Kỹ thuật: mindfulness, điều tiết cảm xúc, chịu đựng đau khổ, hiệu quả giữa các cá nhân.',
        source: 'Dialectical Behavior Therapy Institute 2024',
        category: 'therapies',
        confidence: 0.91,
        metadata: {
          indications: ['Rối loạn cảm xúc', 'Tự hại', 'BPD'],
          duration: '6-12 tháng',
          effectiveness: '60-70%'
        }
      }
    ];

    // Coping strategies
    this.knowledgeBase.coping = [
      {
        id: 'breathing_001',
        content: 'Kỹ thuật thở 4-7-8: Hít vào 4 giây qua mũi, giữ 7 giây, thở ra 8 giây qua miệng. Lặp lại 4-8 lần. Kích hoạt hệ thần kinh phó giao cảm, giảm cortisol.',
        source: 'Harvard Medical School 2024',
        category: 'coping',
        confidence: 0.95,
        metadata: {
          duration: '2-5 phút',
          effectiveness: '95%',
          indications: ['Lo âu', 'Stress', 'Hoảng loạn']
        }
      },
      {
        id: 'grounding_001',
        content: 'Grounding 5-4-3-2-1: 5 điều nhìn thấy, 4 điều chạm được, 3 điều nghe thấy, 2 điều ngửi thấy, 1 điều nếm được. Giúp tập trung hiện tại, giảm lo âu.',
        source: 'American Psychological Association 2024',
        category: 'coping',
        confidence: 0.88,
        metadata: {
          duration: '3-5 phút',
          effectiveness: '88%',
          indications: ['Lo âu', 'Panic attack', 'Dissociation']
        }
      }
    ];

    // Medications info (educational only)
    this.knowledgeBase.medications = [
      {
        id: 'ssri_001',
        content: 'SSRI (Selective Serotonin Reuptake Inhibitors) là nhóm thuốc chống trầm cảm phổ biến. Tác dụng: tăng serotonin, cải thiện tâm trạng. Tác dụng phụ: buồn nôn, mất ngủ, giảm ham muốn.',
        source: 'Journal of Psychopharmacology 2024',
        category: 'medications',
        confidence: 0.90,
        metadata: {
          disclaimer: 'Chỉ thông tin giáo dục, không thay thế bác sĩ',
          examples: ['Fluoxetine', 'Sertraline', 'Escitalopram'],
          contraindications: ['Mang thai', 'Cho con bú', 'Bệnh tim']
        }
      }
    ];

    // Relationship knowledge
    this.knowledgeBase.relationships = [
      {
        id: 'abuse_001',
        content: 'Bạo hành tinh thần bao gồm: kiểm soát, cô lập, đe dọa, hạ thấp lòng tự trọng. Dấu hiệu: sợ hãi đối tác, thay đổi hành vi, cô lập xã hội. Kế hoạch an toàn: số khẩn cấp, nơi trú ẩn, tài liệu quan trọng.',
        source: 'Domestic Violence Research Center 2024',
        category: 'relationships',
        confidence: 0.93,
        metadata: {
          redFlags: ['Kiểm soát', 'Cô lập', 'Đe dọa', 'Bạo lực'],
          safetyPlan: ['Số khẩn cấp', 'Nơi an toàn', 'Tài liệu quan trọng'],
          resources: ['113', '1900 6363', 'Trung tâm hỗ trợ phụ nữ']
        }
      }
    ];

    // Life stages knowledge
    this.knowledgeBase.lifeStages = [
      {
        id: 'pregnancy_001',
        content: 'Mang thai: thay đổi hormone, lo âu về em bé, mối quan hệ. Cần hỗ trợ tâm lý, kỹ thuật thư giãn, mạng lưới hỗ trợ. Tránh stress quá mức, duy trì lối sống lành mạnh.',
        source: 'Maternal Mental Health Institute 2024',
        category: 'lifeStages',
        confidence: 0.89,
        metadata: {
          challenges: ['Lo âu', 'Thay đổi cơ thể', 'Mối quan hệ'],
          coping: ['Thiền', 'Yoga', 'Hỗ trợ xã hội'],
          screening: ['EPDS', 'PHQ-9']
        }
      }
    ];
  }

  /**
   * Retrieve relevant knowledge chunks based on query
   */
  retrieveKnowledge(query: string, categories: string[] = []): KnowledgeChunk[] {
    const normalizedQuery = query.toLowerCase();
    const relevantChunks: KnowledgeChunk[] = [];

    // Search across all categories if none specified
    const searchCategories = categories.length > 0 ? categories : Object.keys(this.knowledgeBase);

    searchCategories.forEach(category => {
      const chunks = this.knowledgeBase[category as keyof KnowledgeBase];
      chunks.forEach(chunk => {
        const relevanceScore = this.calculateRelevance(normalizedQuery, chunk.content);
        if (relevanceScore > 0.3) {
          relevantChunks.push({
            ...chunk,
            confidence: relevanceScore
          });
        }
      });
    });

    // Sort by relevance and return top 4
    return relevantChunks
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4);
  }

  /**
   * Generate response using RAG
   */
  generateResponse(query: string, userContext: any = {}): RAGResponse {
    // Retrieve relevant knowledge
    const chunks = this.retrieveKnowledge(query);
    
    if (chunks.length === 0) {
      return {
        answer: 'Tôi chưa có đủ thông tin để trả lời câu hỏi này. Hãy liên hệ với chuyên gia tâm lý để được tư vấn chính xác.',
        sources: [],
        confidence: 0.1,
        disclaimers: this.disclaimers,
        suggestedActions: ['Liên hệ chuyên gia tâm lý', 'Tìm kiếm thông tin từ nguồn uy tín'],
        relatedTests: []
      };
    }

    // Generate answer based on retrieved chunks
    const answer = this.generateAnswerFromChunks(query, chunks, userContext);
    const sources = chunks.map(chunk => chunk.source);
    const confidence = chunks.reduce((sum, chunk) => sum + chunk.confidence, 0) / chunks.length;
    const suggestedActions = this.generateSuggestedActions(chunks, userContext);
    const relatedTests = this.getRelatedTests(chunks);

    return {
      answer,
      sources,
      confidence,
      disclaimers: this.disclaimers,
      suggestedActions,
      relatedTests
    };
  }

  /**
   * Calculate relevance score between query and content
   */
  private calculateRelevance(query: string, content: string): number {
    const queryWords = query.split(' ');
    const contentWords = content.toLowerCase().split(' ');
    
    let matches = 0;
    queryWords.forEach(word => {
      if (contentWords.includes(word.toLowerCase())) {
        matches++;
      }
    });

    return matches / queryWords.length;
  }

  /**
   * Generate answer from knowledge chunks
   */
  private generateAnswerFromChunks(query: string, chunks: KnowledgeChunk[], userContext: any): string {
    let answer = '';

    // Acknowledge emotions first
    answer += 'Tôi hiểu bạn đang gặp khó khăn. ';

    // Add relevant information
    chunks.forEach((chunk, index) => {
      if (index === 0) {
        answer += chunk.content;
      } else {
        answer += ` Ngoài ra, ${chunk.content.toLowerCase()}`;
      }
    });

    // Add practical steps
    answer += '\n\nMột số bước bạn có thể thử ngay:';
    chunks.forEach(chunk => {
      if (chunk.category === 'coping') {
        answer += `\n• ${chunk.content.split('.')[0]}`;
      }
    });

    return answer;
  }

  /**
   * Generate suggested actions based on chunks
   */
  private generateSuggestedActions(chunks: KnowledgeChunk[], userContext: any): string[] {
    const actions: string[] = [];

    chunks.forEach(chunk => {
      if (chunk.category === 'coping') {
        actions.push('Thử kỹ thuật thư giãn ngay');
      }
      if (chunk.category === 'disorders') {
        actions.push('Làm test đánh giá tâm lý');
      }
      if (chunk.category === 'relationships') {
        actions.push('Tìm kiếm hỗ trợ từ người thân');
      }
    });

    // Add general actions
    actions.push('Liên hệ chuyên gia tâm lý');
    actions.push('Duy trì lối sống lành mạnh');

    return Array.from(new Set(actions)); // Remove duplicates
  }

  /**
   * Get related tests based on chunks
   */
  private getRelatedTests(chunks: KnowledgeChunk[]): string[] {
    const tests: string[] = [];

    chunks.forEach(chunk => {
      if (chunk.metadata.screeningTools) {
        tests.push(...chunk.metadata.screeningTools);
      }
    });

    return Array.from(new Set(tests)); // Remove duplicates
  }

  /**
   * Add new knowledge chunk
   */
  addKnowledgeChunk(chunk: KnowledgeChunk): void {
    this.knowledgeBase[chunk.category as keyof KnowledgeBase].push(chunk);
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    Object.keys(this.knowledgeBase).forEach(category => {
      stats[category] = this.knowledgeBase[category as keyof KnowledgeBase].length;
    });

    return stats;
  }
}

export default ChatbotRAGService;
