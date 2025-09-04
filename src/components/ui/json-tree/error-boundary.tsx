import React, { Component, PropsWithChildren, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import type { ErrorBoundaryState, Theme } from "./types";
import { createStyles } from "./utils";

interface JsonTreeErrorBoundaryProps {
  theme: Theme;
}

export class JsonTreeErrorBoundary extends Component<
  PropsWithChildren<JsonTreeErrorBoundaryProps>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<JsonTreeErrorBoundaryProps>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("JsonTreeViewer Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { theme } = this.props;
      const styles = createStyles(theme);

      return (
        <div className={styles.errorBoundary}>
          <div
            className={`flex items-center space-x-2 ${styles.errorText} mb-2`}
          >
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Error Rendering JSON Tree</h3>
          </div>
          <p className={`${styles.errorText} text-sm mb-2`}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleRetry}
            className={styles.errorButton}
            type="button"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
