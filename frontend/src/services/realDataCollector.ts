/**
 * Real Data Collector - Thu thập dữ liệu thật từ các bài test
 * Tự động lưu dữ liệu test thật vào research database
 */

import { realResearchService } from './realResearchService';

class RealDataCollector {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Khởi tạo data collector
   */
  private initialize(): void {
    if (this.isInitialized) return;
    
    // Lắng nghe sự kiện test hoàn thành
    this.setupTestCompletionListener();
    this.isInitialized = true;
    console.log('Real Data Collector initialized');
  }

  /**
   * Lắng nghe sự kiện test hoàn thành
   */
  private setupTestCompletionListener(): void {
    // Lắng nghe sự kiện từ localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'testResults' && e.newValue) {
        this.processNewTestData();
      }
    });

    // Kiểm tra dữ liệu mới mỗi 2 giây (nhanh hơn)
    setInterval(() => {
      this.processNewTestData();
    }, 2000);
    
    // Xử lý ngay lập tức khi khởi tạo
    setTimeout(() => {
      this.processNewTestData();
    }, 1000);
  }

  /**
   * Xử lý dữ liệu test mới
   */
  private processNewTestData(): void {
    try {
      const testResults = localStorage.getItem('testResults');
      if (!testResults) {
        // Silent check - no console log
        return;
      }

      const parsed = JSON.parse(testResults);
      if (!Array.isArray(parsed)) {
        console.log('testResults is not an array');
        return;
      }

      console.log(`Found ${parsed.length} test results in localStorage`);

      // Lấy dữ liệu mới nhất
      const latestTest = parsed[parsed.length - 1];
      if (!latestTest) {
        console.log('No latest test found');
        return;
      }

      console.log('Latest test:', latestTest.id);

      // Kiểm tra xem đã được lưu chưa
      const savedTests = localStorage.getItem('savedToResearch');
      const savedArray = savedTests ? JSON.parse(savedTests) : [];
      
      if (savedArray.includes(latestTest.id)) {
        console.log('Test already saved to research:', latestTest.id);
        return;
      }

      console.log('Processing new test data:', latestTest.id);

      // Chuyển đổi và lưu vào research database
      this.convertAndSaveTestData(latestTest);
      
      // Đánh dấu đã lưu
      savedArray.push(latestTest.id);
      localStorage.setItem('savedToResearch', JSON.stringify(savedArray));
      
      console.log('Test data saved to research database:', latestTest.id);
    } catch (error) {
      console.error('Error processing new test data:', error);
    }
  }

  /**
   * Chuyển đổi và lưu dữ liệu test
   */
  private convertAndSaveTestData(testData: any): void {
    try {
      const researchData = {
        id: testData.id,
        timestamp: testData.timestamp,
        demographics: testData.demographics || {
          age: null, // Không có thông tin tuổi
          gender: null, // Không có thông tin giới tính
          education: null, // Không có thông tin học vấn
          occupation: null, // Không có thông tin nghề nghiệp
          location: null, // Không có thông tin địa điểm
          maritalStatus: null, // Không có thông tin tình trạng hôn nhân
          children: null, // Không có thông tin con cái
          income: null // Không có thông tin thu nhập
        },
        testResults: testData.testResults || [],
        sessionData: {
          sessionId: testData.sessionId || `session_${Date.now()}`,
          startTime: new Date(testData.startTime || Date.now()),
          endTime: new Date(testData.endTime || Date.now()),
          duration: testData.duration || 30,
          pageViews: testData.pageViews || 1,
          interactions: testData.interactions || 10
        },
        culturalContext: testData.culturalContext || {
          region: null, // Không có thông tin vùng miền
          language: 'vietnamese', // Chỉ biết ngôn ngữ
          religion: null, // Không có thông tin tôn giáo
          ethnicity: null // Không có thông tin dân tộc
        },
        qualityMetrics: testData.qualityMetrics || {
          completeness: 1.0, // Test hoàn thành 100%
          validity: 1.0, // Dữ liệu thật
          reliability: 1.0, // Đáng tin cậy
          responseTime: 0 // Không đo
        }
      };

      // Lưu vào research service
      realResearchService.addRealTestData(researchData);
      
      console.log(`Real test data saved to research database: ${testData.id}`);
    } catch (error) {
      console.error('Error converting test data:', error);
    }
  }

  /**
   * Lấy thống kê dữ liệu thật
   */
  getRealDataStats(): any {
    try {
      const testResults = localStorage.getItem('testResults');
      if (!testResults) return { totalTests: 0, totalParticipants: 0 };

      const parsed = JSON.parse(testResults);
      const uniqueParticipants = new Set(parsed.map((test: any) => test.participantId || test.id));
      
      return {
        totalTests: parsed.length,
        totalParticipants: uniqueParticipants.size,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting real data stats:', error);
      return { totalTests: 0, totalParticipants: 0 };
    }
  }
}

export const realDataCollector = new RealDataCollector();
export default realDataCollector;
