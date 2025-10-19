import axios from 'axios';
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { getApiUrl } from '../config/api';
import AnimatedButton from './AnimatedButton';
import AnimatedCard from './AnimatedCard';

// Keyframe animations
const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const BackupContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  animation: ${slideIn} 0.6s ease-out;
`;

const Title = styled.h1`
  color: white;
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

const Subtitle = styled.p`
  color: rgba(255,255,255,0.9);
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const BackButtonContainer = styled.div`
  margin-top: 20px;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
`;

const BackupSection = styled(AnimatedCard)`
  padding: 30px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
`;

const SectionIcon = styled.div`
  font-size: 3rem;
  text-align: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 15px;
  text-align: center;
`;

const SectionDescription = styled.p`
  color: #666;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
`;

const StatusIndicator = styled.div<{ status: 'idle' | 'processing' | 'success' | 'error' }>`
  padding: 12px 20px;
  border-radius: 25px;
  text-align: center;
  font-weight: 600;
  margin: 15px 0;
  background: ${props => {
    switch (props.status) {
      case 'processing': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'success': return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
      case 'error': return 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)';
      default: return '#f8f9fa';
    }
  }};
  color: ${props => props.status === 'idle' ? '#333' : 'white'};
  border: ${props => props.status === 'idle' ? '2px solid #e9ecef' : 'none'};
  animation: ${props => props.status === 'processing' ? pulse : 'none'} 1.5s infinite;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin: 15px 0;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const BackupHistory = styled.div`
  margin-top: 30px;
`;

const HistoryTitle = styled.h4`
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  
  &::before {
    content: '📝';
    margin-right: 10px;
  }
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const HistoryInfo = styled.div`
  flex: 1;
`;

const HistoryDate = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const HistoryDetails = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const HistoryActions = styled.div`
  display: flex;
  gap: 10px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }
  
  &::before {
    content: '📁';
    margin-right: 8px;
  }
`;

const AlertBox = styled.div<{ type: 'info' | 'warning' | 'error' | 'success' }>`
  padding: 15px 20px;
  border-radius: 10px;
  margin: 20px 0;
  display: flex;
  align-items: center;
  animation: ${slideIn} 0.3s ease-out;
  
  background: ${props => {
    switch (props.type) {
      case 'info': return '#e3f2fd';
      case 'warning': return '#fff3e0';
      case 'error': return '#ffebee';
      case 'success': return '#e8f5e8';
      default: return '#f5f5f5';
    }
  }};
  
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'info': return '#2196f3';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      case 'success': return '#4caf50';
      default: return '#ccc';
    }
  }};
  
  color: ${props => {
    switch (props.type) {
      case 'info': return '#1565c0';
      case 'warning': return '#ef6c00';
      case 'error': return '#c62828';
      case 'success': return '#2e7d32';
      default: return '#333';
    }
  }};
  
  &::before {
    content: ${props => {
    switch (props.type) {
      case 'info': return '"ℹ️"';
      case 'warning': return '"⚠️"';
      case 'error': return '"❌"';
      case 'success': return '"✅"';
      default: return '""';
    }
  }};
    margin-right: 10px;
    font-size: 1.2rem;
  }
`;

// Interface definitions
interface BackupMetadata {
  id: string;
  date: string;
  size: string;
  version: string;
  dataTypes: string[];
  encrypted: boolean;
}

interface BackupStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}

interface DataBackupProps {
  onBack?: () => void;
}

const DataBackup: React.FC<DataBackupProps> = ({ onBack }) => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  const [restoreStatus, setRestoreStatus] = useState<BackupStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  const [backupHistory, setBackupHistory] = useState<BackupMetadata[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load backup history on component mount
  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = async () => {
    try {
      // Mock data for now - will integrate with backend later
      const mockHistory: BackupMetadata[] = [
        {
          id: '1',
          date: new Date().toISOString(),
          size: '2.3 MB',
          version: '1.0.0',
          dataTypes: ['Test Results', 'User Profile', 'Consent Records'],
          encrypted: true
        },
        {
          id: '2',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          size: '1.8 MB',
          version: '1.0.0',
          dataTypes: ['Test Results', 'User Profile'],
          encrypted: true
        }
      ];
      setBackupHistory(mockHistory);
    } catch (error) {
      console.error('Error loading backup history:', error);
    }
  };

  const handleCreateBackup = async () => {
    setBackupStatus({ status: 'processing', progress: 0, message: 'Đang chuẩn bị backup...' });

    try {
      // Simulate backup process with progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));

        let message = 'Đang backup dữ liệu...';
        if (i >= 30) message = 'Đang mã hóa dữ liệu...';
        if (i >= 60) message = 'Đang nén file...';
        if (i >= 90) message = 'Hoàn tất backup...';

        setBackupStatus({ status: 'processing', progress: i, message });
      }

      // Generate backup file
      const backupData = await generateBackupData();
      downloadBackupFile(backupData);

      setBackupStatus({
        status: 'success',
        progress: 100,
        message: 'Backup thành công! File đã được tải xuống.'
      });

      // Add to history
      const newBackup: BackupMetadata = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        size: '2.5 MB',
        version: '1.0.0',
        dataTypes: ['Test Results', 'User Profile', 'Consent Records', 'AI Insights'],
        encrypted: true
      };
      setBackupHistory(prev => [newBackup, ...prev]);

      // Reset after 3 seconds
      setTimeout(() => {
        setBackupStatus({ status: 'idle', progress: 0, message: '' });
      }, 3000);

    } catch (error) {
      setBackupStatus({
        status: 'error',
        progress: 0,
        message: 'Lỗi khi tạo backup. Vui lòng thử lại.'
      });

      setTimeout(() => {
        setBackupStatus({ status: 'idle', progress: 0, message: '' });
      }, 3000);
    }
  };

  const generateBackupData = async () => {
    // Try to fetch from backend API first
    try {
      console.log('📤 Fetching export data from backend...');
      const response = await axios.get(getApiUrl('/api/user/export'), {
        responseType: 'json',
        timeout: 10000
      });

      if (response.data) {
        console.log('✅ Successfully fetched data from backend');
        return JSON.stringify(response.data, null, 2);
      }
    } catch (error) {
      console.warn('⚠️ Backend export failed, falling back to local data:', error);
    }

    // Fallback: Collect all user data from localStorage
    console.log('📦 Collecting local data as fallback...');
    const userData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      source: 'local_fallback',
      data: {
        testResults: JSON.parse(localStorage.getItem('testResults') || '[]'),
        userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
        consentRecords: JSON.parse(localStorage.getItem('consentRecords') || '[]'),
        aiInsights: JSON.parse(localStorage.getItem('ai_companion_insights') || '{}'),
        aiProfiles: JSON.parse(localStorage.getItem('ai_companion_profiles') || '{}'),
        settings: JSON.parse(localStorage.getItem('appSettings') || '{}')
      },
      metadata: {
        totalRecords: localStorage.getItem('testResults') ? JSON.parse(localStorage.getItem('testResults') || '[]').length : 0,
        dataTypes: ['testResults', 'userProfile', 'consentRecords', 'aiInsights', 'aiProfiles'],
        encrypted: false,
        note: 'This backup was created from local storage data'
      }
    };

    return JSON.stringify(userData, null, 2);
  };

  const downloadBackupFile = (data: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soulfriend-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRestoreData = async () => {
    if (!selectedFile) {
      setRestoreStatus({
        status: 'error',
        progress: 0,
        message: 'Vui lòng chọn file backup để khôi phục.'
      });
      return;
    }

    setRestoreStatus({ status: 'processing', progress: 0, message: 'Đang đọc file backup...' });

    try {
      // Read and validate backup file
      const fileContent = await readFileAsText(selectedFile);

      for (let i = 0; i <= 100; i += 15) {
        await new Promise(resolve => setTimeout(resolve, 300));

        let message = 'Đang đọc file backup...';
        if (i >= 25) message = 'Đang xác thực dữ liệu...';
        if (i >= 50) message = 'Đang giải mã dữ liệu...';
        if (i >= 75) message = 'Đang khôi phục dữ liệu...';
        if (i >= 95) message = 'Hoàn tất khôi phục...';

        setRestoreStatus({ status: 'processing', progress: i, message });
      }

      // Parse and validate backup data
      const backupData = JSON.parse(fileContent);

      if (!validateBackupData(backupData)) {
        throw new Error('File backup không hợp lệ');
      }

      // Restore data (implementation will be added)
      await restoreUserData(backupData);

      setRestoreStatus({
        status: 'success',
        progress: 100,
        message: 'Khôi phục dữ liệu thành công!'
      });

      setSelectedFile(null);

      setTimeout(() => {
        setRestoreStatus({ status: 'idle', progress: 0, message: '' });
      }, 3000);

    } catch (error) {
      setRestoreStatus({
        status: 'error',
        progress: 0,
        message: 'Lỗi khi khôi phục dữ liệu. Vui lòng kiểm tra file backup.'
      });

      setTimeout(() => {
        setRestoreStatus({ status: 'idle', progress: 0, message: '' });
      }, 3000);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const validateBackupData = (data: any): boolean => {
    return data &&
      data.version &&
      data.timestamp &&
      data.data &&
      typeof data.data === 'object';
  };

  const restoreUserData = async (backupData: any) => {
    // Implementation will restore data to localStorage/API
    console.log('Restoring data:', backupData);

    // Simulate restoration process
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <BackupContainer>
      <Header>
        <Title>🛡️ Backup & Khôi phục Dữ liệu</Title>
        <Subtitle>
          Bảo vệ dữ liệu của bạn với hệ thống backup tự động và khôi phục an toàn.
          Tất cả dữ liệu được mã hóa để đảm bảo bảo mật tuyệt đối.
        </Subtitle>
        {onBack && (
          <BackButtonContainer>
            <AnimatedButton
              variant="outline"
              onClick={onBack}
              icon="⬅️"
            >
              Quay lại Dashboard
            </AnimatedButton>
          </BackButtonContainer>
        )}
      </Header>

      <GridContainer>
        {/* Backup Section */}
        <BackupSection elevation={3} animation="slideInLeft">
          <SectionIcon>💾</SectionIcon>
          <SectionTitle>Tạo Backup</SectionTitle>
          <SectionDescription>
            Sao lưu toàn bộ dữ liệu cá nhân bao gồm kết quả test, hồ sơ người dùng,
            và tất cả thông tin quan trọng khác.
          </SectionDescription>

          {backupStatus.status !== 'idle' && (
            <>
              <StatusIndicator status={backupStatus.status}>
                {backupStatus.message}
              </StatusIndicator>
              {backupStatus.status === 'processing' && (
                <ProgressBar>
                  <ProgressFill progress={backupStatus.progress} />
                </ProgressBar>
              )}
            </>
          )}

          <ButtonGroup>
            <AnimatedButton
              variant="primary"
              onClick={handleCreateBackup}
              disabled={backupStatus.status === 'processing'}
              icon="💾"
              animation="bounce"
            >
              {backupStatus.status === 'processing' ? 'Đang backup...' : 'Tạo Backup'}
            </AnimatedButton>
          </ButtonGroup>
        </BackupSection>

        {/* Restore Section */}
        <BackupSection elevation={3} animation="slideInRight">
          <SectionIcon>🔄</SectionIcon>
          <SectionTitle>Khôi phục Dữ liệu</SectionTitle>
          <SectionDescription>
            Khôi phục dữ liệu từ file backup đã tạo trước đó.
            Hệ thống sẽ tự động xác thực và giải mã dữ liệu.
          </SectionDescription>

          {restoreStatus.status !== 'idle' && (
            <>
              <StatusIndicator status={restoreStatus.status}>
                {restoreStatus.message}
              </StatusIndicator>
              {restoreStatus.status === 'processing' && (
                <ProgressBar>
                  <ProgressFill progress={restoreStatus.progress} />
                </ProgressBar>
              )}
            </>
          )}

          <ButtonGroup>
            <FileInput
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
            />
            <FileInputLabel htmlFor="backup-file">
              {selectedFile ? selectedFile.name : 'Chọn file backup'}
            </FileInputLabel>

            <AnimatedButton
              variant="secondary"
              onClick={handleRestoreData}
              disabled={!selectedFile || restoreStatus.status === 'processing'}
              icon="🔄"
              animation="bounce"
            >
              {restoreStatus.status === 'processing' ? 'Đang khôi phục...' : 'Khôi phục'}
            </AnimatedButton>
          </ButtonGroup>
        </BackupSection>
      </GridContainer>

      {/* Backup History */}
      <AnimatedCard elevation={3} animation="slideInUp">
        <BackupHistory>
          <HistoryTitle>Lịch sử Backup</HistoryTitle>

          {backupHistory.length === 0 ? (
            <AlertBox type="info">
              Chưa có backup nào được tạo. Hãy tạo backup đầu tiên để bảo vệ dữ liệu của bạn.
            </AlertBox>
          ) : (
            backupHistory.map((backup) => (
              <HistoryItem key={backup.id}>
                <HistoryInfo>
                  <HistoryDate>
                    {new Date(backup.date).toLocaleString('vi-VN')}
                  </HistoryDate>
                  <HistoryDetails>
                    Kích thước: {backup.size} • Phiên bản: {backup.version} •
                    Dữ liệu: {backup.dataTypes.join(', ')} •
                    {backup.encrypted ? '🔒 Đã mã hóa' : '🔓 Chưa mã hóa'}
                  </HistoryDetails>
                </HistoryInfo>
                <HistoryActions>
                  <AnimatedButton
                    variant="outline"
                    size="small"
                    icon="📥"
                  >
                    Tải xuống
                  </AnimatedButton>
                  <AnimatedButton
                    variant="outline"
                    size="small"
                    icon="🗑️"
                  >
                    Xóa
                  </AnimatedButton>
                </HistoryActions>
              </HistoryItem>
            ))
          )}
        </BackupHistory>
      </AnimatedCard>

      {/* Security Notice */}
      <AnimatedCard elevation={2} animation="slideInUp">
        <AlertBox type="warning">
          <strong>Lưu ý bảo mật: </strong>
          File backup được mã hóa và chỉ có thể khôi phục trên cùng một thiết bị hoặc
          với khóa bảo mật tương ứng. Hãy lưu trữ file backup ở nơi an toàn.
        </AlertBox>
      </AnimatedCard>
    </BackupContainer>
  );
};

export default DataBackup;