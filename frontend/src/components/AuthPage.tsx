/**
 * AuthPage - Login & Register for regular users
 * 
 * Responsive, branded UI matching SoulFriend design.
 * Toggle between Login and Register modes.
 * Privacy notice included.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #E8B4B8 0%, #F5E6E8 50%, #FFF5F5 100%);
`;

const Card = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(232, 180, 184, 0.3);
  padding: 2.5rem;
  width: 100%;
  max-width: 440px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Logo = styled.div`
  text-align: center;
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const Title = styled.h1`
  text-align: center;
  font-size: 1.5rem;
  color: #4A4A4A;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #E8E8E8;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
  outline: none;

  &:focus {
    border-color: #E8B4B8;
    box-shadow: 0 0 0 3px rgba(232, 180, 184, 0.15);
  }

  &::placeholder {
    color: #CCC;
  }
`;

const SubmitButton = styled.button`
  padding: 0.85rem;
  background: linear-gradient(135deg, #E8B4B8, #D4A5A5);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(232, 180, 184, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ToggleText = styled.p`
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  margin-top: 1rem;

  button {
    background: none;
    border: none;
    color: #D4A5A5;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9rem;

    &:hover {
      color: #E8B4B8;
    }
  }
`;

const ErrorMessage = styled.div`
  background: #FFF0F0;
  color: #D32F2F;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  text-align: center;
`;

const PrivacyNotice = styled.div`
  background: #F5F5FF;
  border: 1px solid #E0E0F0;
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 0.78rem;
  color: #666;
  text-align: center;
  margin-top: 0.5rem;
  line-height: 1.4;

  strong {
    color: #555;
  }
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: center;
  display: block;
  margin: 1rem auto 0;

  &:hover {
    color: #E8B4B8;
  }
`;

const TestLink = styled.button`
  background: rgba(232, 180, 184, 0.1);
  border: 1px dashed #E8B4B8;
  border-radius: 10px;
  padding: 0.65rem;
  color: #D4A5A5;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: center;
  margin-top: 0.5rem;
  width: 100%;
  transition: all 0.2s;

  &:hover {
    background: rgba(232, 180, 184, 0.2);
  }
`;

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Mật khẩu tối thiểu 8 ký tự');
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError('Mật khẩu phải có ít nhất 1 chữ thường (a-z)');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)');
        return;
      }
      if (!/\d/.test(password)) {
        setError('Mật khẩu phải có ít nhất 1 chữ số (0-9)');
        return;
      }
    }

    setLoading(true);
    try {
      const result =
        mode === 'login' ? await login(email, password) : await register(email, password);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Logo>🌸</Logo>
        <Title>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</Title>
        <Subtitle>
          {mode === 'login'
            ? 'Đăng nhập để truy cập GameFi và nội dung chuyên sâu'
            : 'Tạo tài khoản miễn phí để khám phá SoulFriend'}
        </Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </InputGroup>

          <InputGroup>
            <Label>Mật khẩu</Label>
            <Input
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </InputGroup>

          {mode === 'register' && (
            <InputGroup>
              <Label>Xác nhận mật khẩu</Label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </InputGroup>
          )}

          <SubmitButton type="submit" disabled={loading}>
            {loading
              ? '⏳ Đang xử lý...'
              : mode === 'login'
              ? 'Đăng nhập'
              : 'Tạo tài khoản'}
          </SubmitButton>
        </Form>

        <ToggleText>
          {mode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button onClick={() => { setMode('register'); setError(''); }}>
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}>
                Đăng nhập
              </button>
            </>
          )}
        </ToggleText>

        <TestLink onClick={() => navigate('/start')}>
          🧠 Làm test DASS-21 miễn phí — không cần đăng nhập
        </TestLink>

        <PrivacyNotice>
          <strong>🔒 Cam kết bảo mật:</strong> Chúng tôi chỉ lưu email và mật khẩu đã mã hóa.
          Không thu thập tên, số điện thoại hay thông tin cá nhân khác.
          Dữ liệu được bảo vệ bằng mã hóa end-to-end.
        </PrivacyNotice>

        <BackLink onClick={() => navigate('/')}>
          ← Quay về trang chủ
        </BackLink>
      </Card>
    </Container>
  );
};

export default AuthPage;
