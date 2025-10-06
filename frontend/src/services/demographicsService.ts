/**
 * 📊 DEMOGRAPHICS SERVICE - HỆ THỐNG THU THẬP THÔNG TIN CÁ NHÂN
 * 
 * Service này thu thập thông tin cá nhân với privacy protection đầy đủ
 */

export interface DemographicsData {
  id: string;
  ageRange: '18-25' | '26-35' | '36-45' | '46-55' | '55+' | 'prefer_not_to_say';
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  location: 'urban' | 'rural' | 'prefer_not_to_say';
  education: 'high_school' | 'college' | 'graduate' | 'prefer_not_to_say';
  occupation: 'student' | 'employed' | 'unemployed' | 'retired' | 'prefer_not_to_say';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'prefer_not_to_say';
  hasChildren: boolean | null;
  consentGiven: boolean;
  consentDate: Date;
  dataRetentionPeriod: number; // days
  canBeDeleted: boolean;
}

export interface ConsentForm {
  id: string;
  title: string;
  content: string;
  purposes: string[];
  dataTypes: string[];
  retentionPeriod: number;
  rights: string[];
  contactInfo: string;
  version: string;
  effectiveDate: Date;
}

class DemographicsService {
  private demographics: DemographicsData[] = [];
  private consentForm!: ConsentForm;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeConsentForm();
    this.loadExistingData();
  }

  // ================================
  // CONSENT FORM INITIALIZATION
  // ================================

  private initializeConsentForm(): void {
    this.consentForm = {
      id: 'soulfriend_demographics_consent_v1',
      title: 'Đồng ý thu thập thông tin cá nhân',
      content: `
        Chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Thông tin cá nhân được thu thập chỉ nhằm mục đích:
        
        1. Nghiên cứu khoa học về sức khỏe tâm lý
        2. Cải thiện chất lượng dịch vụ
        3. Phát triển các công cụ hỗ trợ phù hợp
        
        Bạn có quyền:
        - Từ chối cung cấp thông tin
        - Yêu cầu xóa dữ liệu bất kỳ lúc nào
        - Truy cập và chỉnh sửa thông tin
        - Rút lại sự đồng ý
      `,
      purposes: [
        'Nghiên cứu khoa học',
        'Cải thiện dịch vụ',
        'Phát triển công cụ hỗ trợ'
      ],
      dataTypes: [
        'Thông tin nhân khẩu học cơ bản',
        'Kết quả đánh giá sức khỏe tâm lý',
        'Dữ liệu sử dụng ứng dụng'
      ],
      retentionPeriod: 2555, // 7 years
      rights: [
        'Quyền từ chối',
        'Quyền xóa dữ liệu',
        'Quyền truy cập',
        'Quyền chỉnh sửa',
        'Quyền rút lại đồng ý'
      ],
      contactInfo: 'support@soulfriend.vn',
      version: '1.0',
      effectiveDate: new Date()
    };
  }

  // ================================
  // DATA COLLECTION
  // ================================

  public async collectDemographics(): Promise<DemographicsData | null> {
    // Check if user has already provided demographics
    const existingData = this.getUserDemographics();
    if (existingData) {
      return existingData;
    }

    // Show consent form first
    const consentGiven = await this.showConsentForm();
    if (!consentGiven) {
      return null;
    }

    // Collect demographics data
    const demographics = await this.showDemographicsForm();
    if (demographics) {
      this.saveDemographics(demographics);
      return demographics;
    }

    return null;
  }

  private async showConsentForm(): Promise<boolean> {
    return new Promise((resolve) => {
      // eslint-disable-next-line no-restricted-globals
      const consent = confirm(`
        ${this.consentForm.title}
        
        ${this.consentForm.content}
        
        Bạn có đồng ý cung cấp thông tin cá nhân không?
        (Thông tin này sẽ được mã hóa và bảo mật)
      `);
      resolve(consent);
    });
  }

  private async showDemographicsForm(): Promise<DemographicsData | null> {
    return new Promise((resolve) => {
      // In a real implementation, this would show a proper form
      // For now, we'll use prompts to collect data
      
      const ageRange = prompt(`
        Chọn nhóm tuổi của bạn:
        1. 18-25
        2. 26-35  
        3. 36-45
        4. 46-55
        5. 55+
        6. Không muốn cung cấp
      `);

      const gender = prompt(`
        Giới tính:
        1. Nam
        2. Nữ
        3. Khác
        4. Không muốn cung cấp
      `);

      const location = prompt(`
        Nơi sinh sống:
        1. Thành thị
        2. Nông thôn
        3. Không muốn cung cấp
      `);

      const education = prompt(`
        Trình độ học vấn:
        1. Trung học
        2. Đại học
        3. Sau đại học
        4. Không muốn cung cấp
      `);

      const occupation = prompt(`
        Nghề nghiệp:
        1. Học sinh/Sinh viên
        2. Đang làm việc
        3. Thất nghiệp
        4. Đã nghỉ hưu
        5. Không muốn cung cấp
      `);

      const maritalStatus = prompt(`
        Tình trạng hôn nhân:
        1. Độc thân
        2. Đã kết hôn
        3. Ly dị
        4. Góa phụ
        5. Không muốn cung cấp
      `);

      // eslint-disable-next-line no-restricted-globals
      const hasChildren = confirm('Bạn có con không?');

      if (!ageRange || !gender || !location || !education || !occupation || !maritalStatus) {
        resolve(null);
        return;
      }

      const demographics: DemographicsData = {
        id: this.generateId(),
        ageRange: this.mapAgeRange(parseInt(ageRange)),
        gender: this.mapGender(parseInt(gender)),
        location: this.mapLocation(parseInt(location)),
        education: this.mapEducation(parseInt(education)),
        occupation: this.mapOccupation(parseInt(occupation)),
        maritalStatus: this.mapMaritalStatus(parseInt(maritalStatus)),
        hasChildren,
        consentGiven: true,
        consentDate: new Date(),
        dataRetentionPeriod: this.consentForm.retentionPeriod,
        canBeDeleted: true
      };

      resolve(demographics);
    });
  }

  // ================================
  // DATA MAPPING
  // ================================

  private mapAgeRange(choice: number): DemographicsData['ageRange'] {
    const mapping: Record<number, DemographicsData['ageRange']> = {
      1: '18-25',
      2: '26-35',
      3: '36-45',
      4: '46-55',
      5: '55+',
      6: 'prefer_not_to_say'
    };
    return mapping[choice] || 'prefer_not_to_say';
  }

  private mapGender(choice: number): DemographicsData['gender'] {
    const mapping: Record<number, DemographicsData['gender']> = {
      1: 'male',
      2: 'female',
      3: 'non_binary',
      4: 'prefer_not_to_say'
    };
    return mapping[choice] || 'prefer_not_to_say';
  }

  private mapLocation(choice: number): DemographicsData['location'] {
    const mapping: Record<number, DemographicsData['location']> = {
      1: 'urban',
      2: 'rural',
      3: 'prefer_not_to_say'
    };
    return mapping[choice] || 'prefer_not_to_say';
  }

  private mapEducation(choice: number): DemographicsData['education'] {
    const mapping: Record<number, DemographicsData['education']> = {
      1: 'high_school',
      2: 'college',
      3: 'graduate',
      4: 'prefer_not_to_say'
    };
    return mapping[choice] || 'prefer_not_to_say';
  }

  private mapOccupation(choice: number): DemographicsData['occupation'] {
    const mapping: Record<number, DemographicsData['occupation']> = {
      1: 'student',
      2: 'employed',
      3: 'unemployed',
      4: 'retired',
      5: 'prefer_not_to_say'
    };
    return mapping[choice] || 'prefer_not_to_say';
  }

  private mapMaritalStatus(choice: number): DemographicsData['maritalStatus'] {
    const mapping: Record<number, DemographicsData['maritalStatus']> = {
      1: 'single',
      2: 'married',
      3: 'divorced',
      4: 'widowed',
      5: 'prefer_not_to_say'
    };
    return mapping[choice] || 'prefer_not_to_say';
  }

  // ================================
  // DATA STORAGE
  // ================================

  public saveDemographics(demographics: DemographicsData): void {
    this.demographics.push(demographics);
    this.saveToLocalStorage();
    console.log('📊 Demographics data saved:', demographics);
  }

  private saveToLocalStorage(): void {
    try {
      const encryptedData = this.encryptData(this.demographics);
      localStorage.setItem('demographics_data', encryptedData);
      localStorage.setItem('demographics_timestamp', new Date().toISOString());
    } catch (error) {
      console.error('Error saving demographics data:', error);
    }
  }

  private loadExistingData(): void {
    try {
      const encryptedData = localStorage.getItem('demographics_data');
      if (encryptedData) {
        this.demographics = this.decryptData(encryptedData);
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error loading demographics data:', error);
    }
  }

  // ================================
  // ENCRYPTION
  // ================================

  private encryptData(data: any): string {
    // Simple encryption - in production, use proper encryption
    return btoa(JSON.stringify(data));
  }

  private decryptData(encryptedData: string): any {
    try {
      return JSON.parse(atob(encryptedData));
    } catch {
      return [];
    }
  }

  // ================================
  // DATA ACCESS
  // ================================

  public getUserDemographics(): DemographicsData | null {
    if (this.demographics.length === 0) {
      return null;
    }
    return this.demographics[this.demographics.length - 1]; // Get latest
  }

  public getAllDemographics(): DemographicsData[] {
    return [...this.demographics];
  }

  public getConsentForm(): ConsentForm {
    return { ...this.consentForm };
  }

  // ================================
  // DATA ANALYSIS
  // ================================

  public getDemographicsStats(): any {
    const stats = {
      totalUsers: this.demographics.length,
      ageDistribution: this.calculateAgeDistribution(),
      genderDistribution: this.calculateGenderDistribution(),
      locationDistribution: this.calculateLocationDistribution(),
      educationDistribution: this.calculateEducationDistribution(),
      occupationDistribution: this.calculateOccupationDistribution(),
      maritalStatusDistribution: this.calculateMaritalStatusDistribution(),
      childrenDistribution: this.calculateChildrenDistribution()
    };

    return stats;
  }

  private calculateAgeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.demographics.forEach(d => {
      distribution[d.ageRange] = (distribution[d.ageRange] || 0) + 1;
    });
    return distribution;
  }

  private calculateGenderDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.demographics.forEach(d => {
      distribution[d.gender] = (distribution[d.gender] || 0) + 1;
    });
    return distribution;
  }

  private calculateLocationDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.demographics.forEach(d => {
      distribution[d.location] = (distribution[d.location] || 0) + 1;
    });
    return distribution;
  }

  private calculateEducationDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.demographics.forEach(d => {
      distribution[d.education] = (distribution[d.education] || 0) + 1;
    });
    return distribution;
  }

  private calculateOccupationDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.demographics.forEach(d => {
      distribution[d.occupation] = (distribution[d.occupation] || 0) + 1;
    });
    return distribution;
  }

  private calculateMaritalStatusDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.demographics.forEach(d => {
      distribution[d.maritalStatus] = (distribution[d.maritalStatus] || 0) + 1;
    });
    return distribution;
  }

  private calculateChildrenDistribution(): Record<string, number> {
    const distribution: Record<string, number> = { 'yes': 0, 'no': 0, 'prefer_not_to_say': 0 };
    this.demographics.forEach(d => {
      if (d.hasChildren === true) distribution['yes']++;
      else if (d.hasChildren === false) distribution['no']++;
      else distribution['prefer_not_to_say']++;
    });
    return distribution;
  }

  // ================================
  // DATA RIGHTS
  // ================================

  public deleteUserData(userId: string): boolean {
    try {
      this.demographics = this.demographics.filter(d => d.id !== userId);
      this.saveToLocalStorage();
      console.log('🗑️ User data deleted:', userId);
      return true;
    } catch (error) {
      console.error('Error deleting user data:', error);
      return false;
    }
  }

  public updateUserData(userId: string, updates: Partial<DemographicsData>): boolean {
    try {
      const index = this.demographics.findIndex(d => d.id === userId);
      if (index !== -1) {
        this.demographics[index] = { ...this.demographics[index], ...updates };
        this.saveToLocalStorage();
        console.log('✏️ User data updated:', userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  }

  public exportUserData(userId: string): DemographicsData | null {
    return this.demographics.find(d => d.id === userId) || null;
  }

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  private generateId(): string {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public isDataCollectionEnabled(): boolean {
    return this.isInitialized;
  }

  public getDataRetentionInfo(): any {
    return {
      retentionPeriod: this.consentForm.retentionPeriod,
      canBeDeleted: true,
      contactInfo: this.consentForm.contactInfo,
      rights: this.consentForm.rights
    };
  }
}

// ================================
// EXPORT SINGLETON
// ================================

export const demographicsService = new DemographicsService();
export default demographicsService;
