import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorScreen from './ErrorScreen';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.replace('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          status={500}
          title="Application error"
          message="The app hit an unexpected runtime error."
          primaryLabel="Reload"
          secondaryLabel="Home"
          onPrimary={this.handleReload}
          onSecondary={this.handleHome}
        />
      );
    }

    return this.props.children;
  }
}
