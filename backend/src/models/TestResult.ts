/**
 * Model cho việc lưu trữ kết quả các bài test tâm lý
 */

import mongoose, { Document, Schema } from 'mongoose';
import { IConsent } from './Consent';

// Enum định nghĩa các loại test
export enum TestType {
  DASS_21 = 'DASS-21',
  GAD_7 = 'GAD-7',
  PHQ_9 = 'PHQ-9',
  EPDS = 'EPDS',
  SELF_COMPASSION = 'SELF_COMPASSION',
  MINDFULNESS = 'MINDFULNESS',
  SELF_CONFIDENCE = 'SELF_CONFIDENCE',
  ROSENBERG_SELF_ESTEEM = 'ROSENBERG_SELF_ESTEEM',
  PMS = 'PMS',
  MENOPAUSE_RATING = 'MENOPAUSE_RATING',
}

// Interface cho đánh giá kết quả
export interface IEvaluation {
  testType: string; // Loại test
  totalScore: number; // Tổng điểm
  severity: string; // Mức độ nghiêm trọng
  interpretation: string; // Giải thích kết quả
  recommendations: string[]; // Lời khuyên và gợi ý
}

// Interface định nghĩa cấu trúc dữ liệu TestResult
export interface ITestResult extends Document {
  testType: TestType; // Loại test
  answers: number[]; // Mảng câu trả lời (điểm số cho mỗi câu)
  totalScore: number; // Tổng điểm
  subscaleScores?: {
    // Điểm số các thang con (cho DASS-21)
    depression?: number;
    anxiety?: number;
    stress?: number;
  };
  evaluation: IEvaluation; // Đánh giá kết quả
  consentId: mongoose.Types.ObjectId | IConsent; // Liên kết với consent
  completedAt: Date; // Thời gian hoàn thành
  duration?: number; // Thời gian làm bài (giây)
  createdAt: Date;
  updatedAt: Date;
}

// Schema cho Evaluation
const EvaluationSchema = new Schema(
  {
    testType: {
      type: String,
      required: [true, 'Loại test là bắt buộc'],
    },
    totalScore: {
      type: Number,
      required: [true, 'Tổng điểm là bắt buộc'],
    },
    severity: {
      type: String,
      required: [true, 'Mức độ nghiêm trọng là bắt buộc'],
    },
    interpretation: {
      type: String,
      required: [true, 'Giải thích kết quả là bắt buộc'],
    },
    recommendations: [
      {
        type: String,
      },
    ],
  },
  { _id: false }
);

// Schema cho điểm số thang con
const SubscaleScoresSchema = new Schema(
  {
    depression: Number,
    anxiety: Number,
    stress: Number,
  },
  { _id: false }
);

// Schema MongoDB cho TestResult
const TestResultSchema: Schema = new Schema(
  {
    testType: {
      type: String,
      enum: Object.values(TestType),
      required: [true, 'Loại test là bắt buộc'],
    },
    answers: [
      {
        type: Number,
        required: true,
        min: [0, 'Điểm số không được nhỏ hơn 0'],
        max: [10, 'Điểm số không được lớn hơn 10'],
      },
    ],
    totalScore: {
      type: Number,
      required: [true, 'Tổng điểm là bắt buộc'],
      min: [0, 'Tổng điểm không được âm'],
    },
    subscaleScores: SubscaleScoresSchema,
    evaluation: {
      type: EvaluationSchema,
      required: [true, 'Đánh giá kết quả là bắt buộc'],
    },
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consent',
      required: [true, 'Consent ID là bắt buộc'],
    },
    completedAt: {
      type: Date,
      required: [true, 'Thời gian hoàn thành là bắt buộc'],
      default: Date.now,
    },
    duration: {
      type: Number, // Thời gian làm bài tính bằng giây
      min: [0, 'Thời gian làm bài không được âm'],
    },
  },
  {
    timestamps: true,
    collection: 'test_results',
  }
);

// Tạo index để tối ưu query
TestResultSchema.index({ completedAt: -1 }); // Index giảm dần theo thời gian
TestResultSchema.index({ testType: 1 }); // Index theo loại test
TestResultSchema.index({ consentId: 1 }); // Index theo consent ID
TestResultSchema.index({ 'evaluation.level': 1 }); // Index theo mức độ đánh giá

// Virtual field để hiển thị thời gian hoàn thành theo múi giờ Việt Nam
TestResultSchema.virtual('completedAtVN').get(function (this: ITestResult) {
  return this.completedAt.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
});

// Virtual field để tính phần trăm điểm số (dựa trên số câu hỏi)
TestResultSchema.virtual('scorePercentage').get(function (this: ITestResult) {
  const maxPossibleScore = this.answers.length * 3; // Giả sử mỗi câu tối đa 3 điểm
  return Math.round((this.totalScore / maxPossibleScore) * 100);
});

// Đảm bảo virtual fields được include khi convert sang JSON
TestResultSchema.set('toJSON', { virtuals: true });

// Middleware để validate số lượng câu trả lời phù hợp với loại test
TestResultSchema.pre('save', function (this: ITestResult, next) {
  const expectedAnswerCounts: { [key in TestType]: number } = {
    [TestType.DASS_21]: 21,
    [TestType.GAD_7]: 7,
    [TestType.PHQ_9]: 9,
    [TestType.EPDS]: 10,
    [TestType.SELF_COMPASSION]: 10,
    [TestType.MINDFULNESS]: 20,
    [TestType.SELF_CONFIDENCE]: 10,
    [TestType.ROSENBERG_SELF_ESTEEM]: 10,
    [TestType.PMS]: 15,
    [TestType.MENOPAUSE_RATING]: 11,
  };

  const expectedCount = expectedAnswerCounts[this.testType];
  if (this.answers.length !== expectedCount) {
    return next(
      new Error(
        `Test ${this.testType} cần có đúng ${expectedCount} câu trả lời, nhưng nhận được ${this.answers.length} câu`
      ),
    );
  }

  next();
});

// Export model
const TestResult = mongoose.model<ITestResult>('TestResult', TestResultSchema);
export default TestResult;
