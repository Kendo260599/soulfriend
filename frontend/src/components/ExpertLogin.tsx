/**
 * ExpertLogin Component
 * Login page for crisis intervention experts
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ExpertLogin.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://soulfriend-api.onrender.com';

interface ExpertLoginProps {}

const ExpertLogin: React.FC<ExpertLoginProps> = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v2/expert/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      // Save token and expert info
      localStorage.setItem('expertToken', data.token);
      localStorage.setItem('expertInfo', JSON.stringify(data.expert));

      console.log('✅ Expert logged in:', data.expert);

      // Redirect to dashboard
      navigate('/expert/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Đã xảy ra lỗi khi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expert-login-container">
      <div className="expert-login-card">
        <div className="expert-login-header">
          <h1>🩺 SoulFriend Expert</h1>
          <p>Hệ Thống Can Thiệp Khủng Hoảng</p>
        </div>

        <form onSubmit={handleSubmit} className="expert-login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="expert@soulfriend.app"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="expert-login-footer">
          <p className="info-text">
            🔒 Hệ thống dành riêng cho chuyên gia tâm lý được xác nhận
          </p>
          <p className="support-text">
            Liên hệ hỗ trợ: <a href="mailto:kendo2605@gmail.com">kendo2605@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExpertLogin;





