/**
 * ErrorBoundary Component
 * Catches JavaScript errors in the component tree and displays a fallback UI
 * 
 * Features:
 * - Catches errors in child components
 * - Logs errors for debugging
 * - Provides user-friendly error messages
 * - Supports error recovery
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 * 
 * Or wrap the entire app:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Styled components
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.4s ease-out;
`;

const ErrorIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2.5rem;
  animation: ${pulse} 2s infinite;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: #2d3748;
  margin-bottom: 0.75rem;
  text-align: center;
  font-weight: 700;
`;

const Message = styled.p`
  font-size: 1rem;
  color: #718096;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const DetailsBox = styled.details`
  background: #f7fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #4a5568;
  
  summary {
    cursor: pointer;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #2d3748;
    
    &:hover {
      color: #4a5568;
    }
  }
`;

const ErrorStack = styled.pre`
  background: #1a202c;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 0.875rem 1.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  &:hover {
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }
`;

const SecondaryButton = styled(Button)`
  background: #e2e8f0;
  color: #4a5568;
  
  &:hover {
    background: #cbd5e0;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

// Error logging service (can be replaced with Sentry, LogRocket, etc.)
const logError = (error: Error, errorInfo: ErrorInfo) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ErrorBoundary caught an error:', errorData);
  }
  
  // In production, you would send to an error tracking service:
  // Sentry.captureException(error, { extra: errorInfo });
  // or LogRocket.error(error);
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    logError(error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = (): void => {
    this.setState({ isRetrying: true });
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.setState({ isRetrying: true });
    window.location.href = '/';
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, isRetrying } = this.state;
    const { children, fallback, showDetails = true } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorContainer role="alert" aria-live="polite">
          <ErrorCard>
            <ErrorIcon aria-hidden="true">!</ErrorIcon>
            
            <Title>Đã xảy ra lỗi</Title>
            <Message>
              Rất tiếc, đã có lỗi không mong muốn xảy ra. 
              Chúng tôi đã được thông báo và đang xử lý.
              Vui lòng thử lại sau.
            </Message>

            {showDetails && (error || errorInfo) && (
              <DetailsBox>
                <summary>Chi tiết lỗi (dành cho developer)</summary>
                {error && <p style={{ marginBottom: '0.5rem' }}><strong>Message:</strong> {error.message}</p>}
                {errorInfo?.componentStack && (
                  <ErrorStack>
                    {errorInfo.componentStack}
                  </ErrorStack>
                )}
              </DetailsBox>
            )}

            <ButtonGroup>
              <PrimaryButton 
                onClick={this.handleReload}
                disabled={isRetrying}
                aria-label="Tải lại trang"
              >
                {isRetrying ? (
                  <>
                    <LoadingSpinner />
                    Đang tải...
                  </>
                ) : (
                  'Tải lại trang'
                )}
              </PrimaryButton>
              
              <SecondaryButton 
                onClick={this.handleGoHome}
                disabled={isRetrying}
                aria-label="Quay về trang chủ"
              >
                Quay về trang chủ
              </SecondaryButton>
              
              <SecondaryButton 
                onClick={this.handleReset}
                aria-label="Thử hiển thị lại"
              >
                Thử lại
              </SecondaryButton>
            </ButtonGroup>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return children;
  }
}

// Higher-order component version
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithErrorBoundary;
}

// Hook version for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const throwError = React.useCallback((error: Error) => {
    setError(error);
    throw error;
  }, []);

  if (error) {
    throw error;
  }

  return { error, resetError, throwError };
}

export default ErrorBoundary;
