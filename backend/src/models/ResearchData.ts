/**
 * ResearchData Model - Lưu trữ dữ liệu nghiên cứu từ các bài test
 * Privacy-first: Không lưu thông tin cá nhân
 */

import { Schema, model, Document } from 'mongoose';

// Interface cho TestResult trong ResearchData
interface ITestResult {
  testType: string;
  score: number;
  severity?: string;
  answers: number[];
  completionTime?: number;
  subscaleScores?: {
    depression?: number;
    anxiety?: number;
    stress?: number;
  };
}

// Interface cho Quality Metrics
interface IQualityMetrics {
  completeness: number;
  validity: number;
  reliability: number;
  responseTime: number;
}

// Interface cho Session Data
interface ISessionData {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  device?: string;
  browser?: string;
  userAgent?: string;
  ipAddress?: string;
}

// Main Interface
export interface IResearchData extends Document {
  participantId: string;
  timestamp: Date;
  testResults: ITestResult[];
  sessionData: ISessionData;
  qualityMetrics: IQualityMetrics;
  
  // Privacy-first: Không lưu demographics cá nhân
  // Chỉ lưu metadata cần thiết cho nghiên cứu
  metadata?: {
    version: string;
    platform: string;
    locale: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Schema cho TestResult
const TestResultSchema = new Schema({
  testType: {
    type: String,
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true
  },
  severity: {
    type: String
  },
  answers: [{
    type: Number,
    required: true
  }],
  completionTime: {
    type: Number
  },
  subscaleScores: {
    depression: Number,
    anxiety: Number,
    stress: Number
  }
}, { _id: false });

// Schema cho QualityMetrics
const QualityMetricsSchema = new Schema({
  completeness: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 1.0
  },
  validity: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 1.0
  },
  reliability: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 1.0
  },
  responseTime: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Schema cho SessionData
const SessionDataSchema = new Schema({
  sessionId: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  device: String,
  browser: String,
  userAgent: String,
  ipAddress: String
}, { _id: false });

// Main Schema
const ResearchDataSchema = new Schema({
  participantId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  testResults: {
    type: [TestResultSchema],
    required: true,
    validate: {
      validator: function(v: ITestResult[]) {
        return v && v.length > 0;
      },
      message: 'Phải có ít nhất 1 test result'
    }
  },
  sessionData: {
    type: SessionDataSchema,
    required: true
  },
  qualityMetrics: {
    type: QualityMetricsSchema,
    required: true
  },
  metadata: {
    version: String,
    platform: String,
    locale: String
  }
}, {
  timestamps: true,
  collection: 'research_data'
});

// Indexes để tối ưu queries
ResearchDataSchema.index({ timestamp: -1 }); // Newest first
ResearchDataSchema.index({ participantId: 1 });
ResearchDataSchema.index({ 'testResults.testType': 1 });
ResearchDataSchema.index({ createdAt: -1 });

// Compound index cho research queries phức tạp
ResearchDataSchema.index({ 
  timestamp: -1, 
  'testResults.testType': 1 
});

// Virtual để tính số lượng tests
ResearchDataSchema.virtual('testCount').get(function(this: IResearchData) {
  return this.testResults.length;
});

// Methods
ResearchDataSchema.methods.getAverageScore = function(this: IResearchData): number {
  if (this.testResults.length === 0) return 0;
  const sum = this.testResults.reduce((acc, test) => acc + test.score, 0);
  return sum / this.testResults.length;
};

// Static methods
ResearchDataSchema.statics.findByTestType = function(testType: string) {
  return this.find({ 'testResults.testType': testType });
};

ResearchDataSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

ResearchDataSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalTests: { $sum: { $size: '$testResults' } },
        avgQuality: { $avg: '$qualityMetrics.completeness' },
        earliestDate: { $min: '$timestamp' },
        latestDate: { $max: '$timestamp' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRecords: 0,
    totalTests: 0,
    avgQuality: 0,
    earliestDate: null,
    latestDate: null
  };
};

// Export model
export const ResearchData = model<IResearchData>('ResearchData', ResearchDataSchema);

export default ResearchData;

