import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';
import { Component } from 'react';

import { Button } from '../../components/ui/Button';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Uncaught error in AppErrorBoundary', error, info);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>糟糕，体验出了点问题</h1>
          <p>请尝试刷新页面，如果问题持续出现请联系支持团队。</p>
          <Button variant="primary" onClick={this.handleReset}>
            刷新页面
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
