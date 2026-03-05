import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const PrivacyContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
`;

const SubSectionTitle = styled.h3`
  color: #34495e;
  margin: 25px 0 15px;
  font-size: 18px;
  font-weight: 500;
`;

const ActionCard = styled.div`
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: #f8f9fa;
  
  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
  
  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: #e74c3c;
          color: white;
          &:hover { background: #c0392b; }
        `;
      case 'secondary':
        return `
          background: #95a5a6;
          color: white;
          &:hover { background: #7f8c8d; }
        `;
      default:
        return `
          background: #3498db;
          color: white;
          &:hover { background: #2980b9; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  
  h3 {
    color: #e74c3c;
    margin-bottom: 15px;
  }
  
  p {
    margin-bottom: 20px;
    line-height: 1.6;
  }
  
  .checkbox-container {
    margin: 15px 0;
    
    label {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      input {
        margin-right: 10px;
      }
    }
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  border-radius: 6px;
  margin: 15px 0;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'error':
        return `
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      default:
        return `
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        `;
    }
  }}
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e1e8ed;
  }
  
  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #2c3e50;
  }
  
  tr:hover {
    background: #f8f9fa;
  }
`;

interface UserData {
  personalInfo: {
    name: string;
    age: number;
    email?: string;
    createdAt: string;
  };
  testResults: Array<{
    testId: string;
    testType: string;
    totalScore: number;
    completedAt: string;
    evaluation: {
      level: string;
      description: string;
    };
  }>;
  consentHistory: Array<{
    consentId: string;
    selectedTests: string[];
    timestamp: string;
  }>;
}

const PrivacyManagement: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v2/user/data');
      setUserData(response.data);
      setMessage({ type: 'success', text: 'Đã tải dữ liệu cá nhân thành công' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể tải dữ liệu. Vui lòng thử lại.' });
    }
    setLoading(false);
  };

  const exportUserData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v2/user/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `soulfriend-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage({ type: 'success', text: 'Đã xuất dữ liệu thành công' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể xuất dữ liệu. Vui lòng thử lại.' });
    }
    setLoading(false);
  };

  const deleteAllData = async () => {
    if (!deleteConfirmed) {
      setMessage({ type: 'error', text: 'Vui lòng xác nhận bạn hiểu hậu quả của việc xóa dữ liệu' });
      return;
    }

    setLoading(true);
    try {
      await axios.delete('/api/v2/user/data');
      setUserData(null);
      setShowDeleteDialog(false);
      setDeleteConfirmed(false);
      setMessage({ 
        type: 'success', 
        text: 'Đã xóa tất cả dữ liệu thành công. Tài khoản của bạn đã được hủy.' 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể xóa dữ liệu. Vui lòng liên hệ hỗ trợ.' });
    }
    setLoading(false);
  };

  const withdrawConsent = async () => {
    setLoading(true);
    try {
      await axios.post('/api/v2/user/withdraw-consent');
      setMessage({ 
        type: 'success', 
        text: 'Đã rút lại sự đồng ý. Dữ liệu của bạn sẽ chỉ được lưu trữ theo yêu cầu pháp lý.' 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể rút lại đồng ý. Vui lòng thử lại.' });
    }
    setLoading(false);
  };

  return (
    <PrivacyContainer>
      <SectionTitle>🔒 Quản lý Quyền riêng tư & Dữ liệu</SectionTitle>
      
      {message && (
        <StatusMessage type={message.type}>
          {message.text}
        </StatusMessage>
      )}

      <SubSectionTitle>Quyền truy cập dữ liệu</SubSectionTitle>
      <ActionCard>
        <h4>Xem dữ liệu cá nhân</h4>
        <p>Xem tất cả thông tin cá nhân và kết quả test mà chúng tôi lưu trữ về bạn.</p>
        <ActionButton onClick={fetchUserData} disabled={loading}>
          {loading ? 'Đang tải...' : 'Xem dữ liệu'}
        </ActionButton>
      </ActionCard>

      {userData && (
        <ActionCard>
          <h4>Thông tin cá nhân</h4>
          <DataTable>
            <tbody>
              <tr>
                <td><strong>Tên:</strong></td>
                <td>{userData.personalInfo.name}</td>
              </tr>
              <tr>
                <td><strong>Tuổi:</strong></td>
                <td>{userData.personalInfo.age}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>{userData.personalInfo.email || 'Chưa cung cấp'}</td>
              </tr>
              <tr>
                <td><strong>Ngày tạo tài khoản:</strong></td>
                <td>{new Date(userData.personalInfo.createdAt).toLocaleDateString('vi-VN')}</td>
              </tr>
            </tbody>
          </DataTable>

          <h4 style={{ marginTop: '25px' }}>Kết quả test ({userData.testResults.length})</h4>
          {userData.testResults.length > 0 ? (
            <DataTable>
              <thead>
                <tr>
                  <th>Loại test</th>
                  <th>Điểm số</th>
                  <th>Mức độ</th>
                  <th>Ngày thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {userData.testResults.map((result, index) => (
                  <tr key={index}>
                    <td>{result.testType}</td>
                    <td>{result.totalScore}</td>
                    <td>{result.evaluation?.level || 'Không rõ'}</td>
                    <td>{result.completedAt ? new Date(result.completedAt).toLocaleDateString('vi-VN') : 'Không rõ'}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <p>Chưa có kết quả test nào.</p>
          )}
        </ActionCard>
      )}

      <SubSectionTitle>Quyền xuất dữ liệu</SubSectionTitle>
      <ActionCard>
        <h4>Tải xuống dữ liệu cá nhân</h4>
        <p>Tải xuống tất cả dữ liệu của bạn ở định dạng JSON để sử dụng ở nơi khác.</p>
        <ActionButton onClick={exportUserData} disabled={loading}>
          {loading ? 'Đang xuất...' : 'Tải xuống dữ liệu'}
        </ActionButton>
      </ActionCard>

      <SubSectionTitle>Quản lý đồng ý</SubSectionTitle>
      <ActionCard>
        <h4>Rút lại sự đồng ý</h4>
        <p>Rút lại sự đồng ý cho việc xử lý dữ liệu cá nhân. Dữ liệu sẽ chỉ được lưu trữ theo yêu cầu pháp lý.</p>
        <ActionButton variant="secondary" onClick={withdrawConsent} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Rút lại đồng ý'}
        </ActionButton>
      </ActionCard>

      <SubSectionTitle>Quyền xóa dữ liệu</SubSectionTitle>
      <ActionCard>
        <h4>⚠️ Xóa tất cả dữ liệu</h4>
        <p>
          <strong>Cảnh báo:</strong> Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu cá nhân, 
          kết quả test và tài khoản của bạn. Không thể hoàn tác!
        </p>
        <ActionButton 
          variant="danger" 
          onClick={() => setShowDeleteDialog(true)} 
          disabled={loading}
        >
          Xóa tất cả dữ liệu
        </ActionButton>
      </ActionCard>

      {showDeleteDialog && (
        <ConfirmDialog>
          <DialogContent>
            <h3>⚠️ Xác nhận xóa dữ liệu</h3>
            <p>
              Bạn có chắc chắn muốn xóa <strong>tất cả</strong> dữ liệu cá nhân? 
              Hành động này sẽ:
            </p>
            <ul>
              <li>Xóa vĩnh viễn thông tin cá nhân</li>
              <li>Xóa tất cả kết quả test</li>
              <li>Hủy tài khoản của bạn</li>
              <li>Không thể khôi phục</li>
            </ul>
            
            <div className="checkbox-container">
              <label>
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                />
                Tôi hiểu và chấp nhận hậu quả của việc xóa dữ liệu
              </label>
            </div>

            <ActionButton 
              variant="danger" 
              onClick={deleteAllData} 
              disabled={!deleteConfirmed || loading}
            >
              {loading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </ActionButton>
            <ActionButton 
              variant="secondary" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmed(false);
              }}
              disabled={loading}
            >
              Hủy
            </ActionButton>
          </DialogContent>
        </ConfirmDialog>
      )}
    </PrivacyContainer>
  );
};

export default PrivacyManagement;