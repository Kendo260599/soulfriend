/**
 * API Service with configured axios instance
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for CORS
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available (check all token types)
        const token = localStorage.getItem('adminToken') 
          || localStorage.getItem('expertToken') 
          || localStorage.getItem('sf_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('adminToken');
          // Optionally redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, config);
  }

  // Specific API methods
  public async checkHealth(): Promise<AxiosResponse> {
    return this.get('/api/health');
  }

  public async submitConsent(data: any): Promise<AxiosResponse> {
    return this.post('/api/v2/consent', data);
  }

  public async submitTest(data: any): Promise<AxiosResponse> {
    return this.post('/api/v2/tests/submit', data);
  }

  public async getTestQuestions(testType: string): Promise<AxiosResponse> {
    return this.get(`/api/v2/tests/questions/${testType}`);
  }

  public async adminLogin(credentials: any): Promise<AxiosResponse> {
    return this.post('/api/v2/admin/login', credentials);
  }

  public async getFoundationLesson(learnerId = 1): Promise<AxiosResponse> {
    return this.get(`/api/v2/foundation/lesson?learnerId=${encodeURIComponent(String(learnerId))}`, {
      timeout: API_CONFIG.FOUNDATION_TIMEOUT,
    });
  }

  public async getFoundationTrackLesson(
    track: 'grammar' | 'vocab',
    lessonId: string,
    learnerId = 1,
  ): Promise<AxiosResponse> {
    const query = [
      `learnerId=${encodeURIComponent(String(learnerId))}`,
      `track=${encodeURIComponent(track)}`,
      `lessonId=${encodeURIComponent(lessonId)}`,
    ].join('&');
    return this.get(`/api/v2/foundation/lesson?${query}`, {
      timeout: API_CONFIG.FOUNDATION_TIMEOUT,
    });
  }

  public async getFoundationCurriculum(): Promise<AxiosResponse> {
    return this.get('/api/v2/foundation/curriculum', {
      timeout: API_CONFIG.FOUNDATION_TIMEOUT,
    });
  }

  public async getFoundationProgress(learnerId = 1): Promise<AxiosResponse> {
    return this.get(`/api/v2/foundation/progress?learnerId=${encodeURIComponent(String(learnerId))}`, {
      timeout: API_CONFIG.FOUNDATION_TIMEOUT,
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
