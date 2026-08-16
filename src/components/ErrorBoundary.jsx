import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep this quiet in production UI, but surface it for debugging.
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-box">
          <div className="error-boundary-glow" />
          <span className="error-boundary-icon">⚠</span>
          <h3>Something glitched</h3>
          <p>
            {this.props.label ? `The ${this.props.label} module` : 'This section'} hit an unexpected snag —
            it's isolated, so the rest of Loop is still running fine.
          </p>
          <button className="error-boundary-retry" onClick={this.handleRetry}>↻ Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
