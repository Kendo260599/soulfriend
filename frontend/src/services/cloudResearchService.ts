/**
 * Cloud Research Service
 * Service để lưu và lấy dữ liệu research từ MongoDB cloud
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface CloudResearchData {
  participantId?: string;
  testResults: {
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
  }[];
  sessionData?: {
    sessionId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    device?: string;
    browser?: string;
    userAgent?: string;
  };
  qualityMetrics?: {
    completeness: number;
    validity: number;
    reliability: number;
    responseTime: number;
  };
  metadata?: {
    version: string;
    platform: string;
    locale: string;
  };
}

export interface ResearchStats {
  totalRecords: number;
  totalTests: number;
  avgQuality: number;
  earliestDate: Date | null;
  latestDate: Date | null;
  testTypeBreakdown: {
    _id: string;
    count: number;
    avgScore: number;
  }[];
}

class CloudResearchService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${API_BASE_URL}/research`;
  }

  /**
   * Lưu dữ liệu research lên cloud
   */
  async saveResearchData(data: CloudResearchData): Promise<{
    success: boolean;
    id?: string;
    participantId?: string;
    error?: string;
  }> {
    try {
      console.log('📤 Saving research data to cloud...', data);

      const response = await axios.post(this.apiUrl, data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10s timeout
      });

      if (response.data.success) {
        console.log('✅ Research data saved to cloud:', response.data.data);
        return {
          success: true,
          id: response.data.data.id,
          participantId: response.data.data.participantId
        };
      } else {
        console.error('❌ Failed to save research data:', response.data.error);
        return {
          success: false,
          error: response.data.error
        };
      }
    } catch (error) {
      console.error('❌ Error saving research data to cloud:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred'
      };
    }
  }

  /**
   * Lấy tất cả research data (Admin only)
   */
  async getAllResearchData(
    token: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      testType?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<{
    success: boolean;
    data?: any[];
    pagination?: any;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.testType) params.append('testType', filters.testType);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.skip) params.append('skip', filters.skip.toString());

      const response = await axios.get(`${this.apiUrl}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching research data:', error);
      return {
        success: false,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.error || error.message
          : 'Unknown error'
      };
    }
  }

  /**
   * Lấy statistics (Admin only)
   */
  async getStatistics(token: string): Promise<{
    success: boolean;
    stats?: ResearchStats;
    error?: string;
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        stats: response.data.stats
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        success: false,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.error || error.message
          : 'Unknown error'
      };
    }
  }

  /**
   * Export data (Admin only)
   */
  async exportData(
    token: string,
    format: 'json' | 'csv' = 'json',
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams({ format });
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${this.apiUrl}/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        // Download CSV file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `research_data_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.error || error.message
          : 'Unknown error'
      };
    }
  }

  /**
   * Check if cloud service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Cloud service not available:', error);
      return false;
    }
  }

  /**
   * Sync localStorage data to cloud
   * Useful for migrating existing data
   */
  async syncLocalStorageToCloud(): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const localData = localStorage.getItem('testResults');
      if (!localData) {
        return {
          success: true,
          synced: 0,
          failed: 0,
          errors: []
        };
      }

      const parsed = JSON.parse(localData);
      if (!Array.isArray(parsed)) {
        return {
          success: false,
          synced: 0,
          failed: 0,
          errors: ['Invalid localStorage data format']
        };
      }

      console.log(`🔄 Syncing ${parsed.length} records to cloud...`);

      let synced = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const item of parsed) {
        try {
          const cloudData: CloudResearchData = {
            participantId: item.id || `P${Date.now()}`,
            testResults: item.testResults || [],
            sessionData: item.sessionData || {
              sessionId: item.id || `session_${Date.now()}`,
              startTime: new Date(item.timestamp || Date.now()),
              endTime: new Date(item.timestamp || Date.now()),
              duration: 0
            },
            qualityMetrics: item.qualityMetrics || {
              completeness: 1.0,
              validity: 1.0,
              reliability: 1.0,
              responseTime: 0
            },
            metadata: {
              version: '3.0',
              platform: 'web',
              locale: 'vi'
            }
          };

          const result = await this.saveResearchData(cloudData);
          if (result.success) {
            synced++;
          } else {
            failed++;
            errors.push(`Failed to sync ${item.id}: ${result.error}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Error syncing ${item.id}: ${(error as Error).message}`);
        }
      }

      console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);

      return {
        success: failed === 0,
        synced,
        failed,
        errors
      };
    } catch (error) {
      console.error('Error syncing localStorage to cloud:', error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [(error as Error).message]
      };
    }
  }
}

// Singleton instance
export const cloudResearchService = new CloudResearchService();

export default cloudResearchService;

