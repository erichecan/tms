// 2025-11-30T12:15:00Z Created by Assistant: 错误边界组件
import React, { Component, ReactNode } from 'react';
import { Card, Button } from 'antd-mobile';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 调用错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 这里可以发送错误到错误追踪服务
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          background: '#f5f5f5',
        }}>
          <Card style={{ maxWidth: 400, width: '100%' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>出错了</h3>
              <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
                {this.state.error?.message || '发生了未知错误'}
              </p>
              <Button
                color="primary"
                block
                onClick={this.handleReset}
              >
                重试
              </Button>
              <Button
                color="default"
                fill="outline"
                block
                onClick={() => window.location.reload()}
                style={{ marginTop: 12 }}
              >
                刷新页面
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

