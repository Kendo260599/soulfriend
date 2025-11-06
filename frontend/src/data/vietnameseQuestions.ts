// Hệ thống câu hỏi tiếng Việt cho các thang đo tâm lý
// Dựa trên nghiên cứu và chuẩn hóa tại Việt Nam

export interface VietnameseQuestion {
  id: number;
  question: string;
  questionEn: string;
  category: string;
  culturalContext: string;
  vietnameseNorms: {
    mean: number;
    sd: number;
  };
}

export interface VietnameseTest {
  name: string;
  nameEn: string;
  description: string;
  instructions: string;
  questions: VietnameseQuestion[];
  scoring: {
    ranges: { [key: string]: { [key: string]: { min: number; max: number; label: string; color: string } } };
    interpretation: { [key: string]: string };
  };
  culturalNotes: string[];
  vietnameseNorms: {
    population: string;
    sampleSize: number;
    reliability: number | null;
    validity: number | null;
    validationStatus?: string;
    validationNote?: string;
    lastUpdated?: string;
    plannedValidation?: string;
  };
}

// DASS-21 - Thang đo Trầm cảm, Lo âu và Căng thẳng
export const dass21Vietnamese: VietnameseTest = {
  name: "Thang đo Trầm cảm, Lo âu và Căng thẳng (DASS-21)",
  nameEn: "Depression, Anxiety and Stress Scale (DASS-21)",
  description: "Thang đo đánh giá mức độ trầm cảm, lo âu và căng thẳng trong 7 ngày qua",
  instructions: "Vui lòng đọc từng câu và chọn câu trả lời phù hợp nhất với tình trạng của bạn trong 7 ngày qua",
  questions: [
    {
      id: 1,
      question: "Tôi cảm thấy khó thư giãn",
      questionEn: "I found it hard to wind down",
      category: "stress",
      culturalContext: "Áp lực công việc và gia đình",
      vietnameseNorms: { mean: 1.2, sd: 0.8 }
    },
    {
      id: 2,
      question: "Tôi cảm thấy khô miệng",
      questionEn: "I was aware of dryness of my mouth",
      category: "anxiety",
      culturalContext: "Triệu chứng cơ thể của lo âu",
      vietnameseNorms: { mean: 0.8, sd: 0.7 }
    },
    {
      id: 3,
      question: "Tôi không thể cảm nhận được cảm xúc tích cực",
      questionEn: "I couldn't seem to experience any positive feeling at all",
      category: "depression",
      culturalContext: "Mất cảm xúc tích cực",
      vietnameseNorms: { mean: 1.1, sd: 0.9 }
    }
  ],
  scoring: {
    ranges: {
      "depression": {
        "normal": { min: 0, max: 9, label: "Bình thường", color: "#4CAF50" },
        "mild": { min: 10, max: 13, label: "Nhẹ", color: "#FFC107" },
        "moderate": { min: 14, max: 20, label: "Trung bình", color: "#FF9800" },
        "severe": { min: 21, max: 27, label: "Nặng", color: "#F44336" },
        "extremely_severe": { min: 28, max: 42, label: "Rất nặng", color: "#9C27B0" }
      },
      "anxiety": {
        "normal": { min: 0, max: 7, label: "Bình thường", color: "#4CAF50" },
        "mild": { min: 8, max: 9, label: "Nhẹ", color: "#FFC107" },
        "moderate": { min: 10, max: 14, label: "Trung bình", color: "#FF9800" },
        "severe": { min: 15, max: 19, label: "Nặng", color: "#F44336" },
        "extremely_severe": { min: 20, max: 42, label: "Rất nặng", color: "#9C27B0" }
      },
      "stress": {
        "normal": { min: 0, max: 14, label: "Bình thường", color: "#4CAF50" },
        "mild": { min: 15, max: 18, label: "Nhẹ", color: "#FFC107" },
        "moderate": { min: 19, max: 25, label: "Trung bình", color: "#FF9800" },
        "severe": { min: 26, max: 33, label: "Nặng", color: "#F44336" },
        "extremely_severe": { min: 34, max: 42, label: "Rất nặng", color: "#9C27B0" }
      }
    },
    interpretation: {
      "depression": "Điểm số cao cho thấy mức độ trầm cảm cao, cần được quan tâm và hỗ trợ",
      "anxiety": "Điểm số cao cho thấy mức độ lo âu cao, có thể ảnh hưởng đến cuộc sống hàng ngày",
      "stress": "Điểm số cao cho thấy mức độ căng thẳng cao, cần có biện pháp giảm stress"
    }
  },
  culturalNotes: [
    "Phụ nữ Việt Nam thường có xu hướng báo cáo cao hơn về stress do áp lực gia đình",
    "Triệu chứng cơ thể thường được báo cáo nhiều hơn triệu chứng tâm lý",
    "Văn hóa 'giữ thể diện' có thể ảnh hưởng đến việc báo cáo các vấn đề tâm lý",
    "Gia đình đóng vai trò quan trọng trong việc hỗ trợ và điều trị"
  ],
  vietnameseNorms: {
    population: "Chưa được khảo sát",
    sampleSize: 0,
    reliability: null,
    validity: null,
    validationStatus: "NOT_VALIDATED",
    validationNote: "⚠️ Bản dịch tiếng Việt CHƯA được chuẩn hóa và kiểm định khoa học theo quy trình quốc tế (forward/back translation, pilot testing, psychometric analysis). Dữ liệu norms chưa có. Kết quả CHỈ có giá trị tham khảo sơ bộ.",
    lastUpdated: "2025-10-25",
    plannedValidation: "Phase 3 (6-12 months)"
  }
};

// Tất cả các thang đo tiếng Việt
export const vietnameseTests: VietnameseTest[] = [
  dass21Vietnamese
];

export default vietnameseTests;