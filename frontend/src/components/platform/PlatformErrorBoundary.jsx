import { Component } from "react";
import { Button } from "@/components/ui/button";

function logBoundaryError(error, info) {
  const label = "[FleetOps] PlatformErrorBoundary";
  const payload = {
    message: error?.message,
    name: error?.name,
    stack: error?.stack,
    componentStack: info?.componentStack,
  };

  if (import.meta.env.DEV) {
    console.groupCollapsed(`${label} — ${error?.message || "Unknown error"}`);
    console.error("Error:", error);
    if (info?.componentStack) {
      console.error("Component stack:", info.componentStack);
    }
    console.groupEnd();
  } else {
    console.error(label, payload);
  }
}

export default class PlatformErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, retryKey: 0 };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logBoundaryError(error, info);
    this.setState({ errorInfo: info });
  }

  handleRetry() {
    this.setState((prev) => ({
      error: null,
      errorInfo: null,
      retryKey: prev.retryKey + 1,
    }));
  }

  render() {
    const { error, errorInfo, retryKey } = this.state;

    if (!error) {
      return <div key={retryKey}>{this.props.children}</div>;
    }

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#F5F6F8] p-6"
        data-testid="platform-error-fallback"
      >
        <div className="max-w-md w-full bg-white border border-black/[0.08] rounded-lg p-8 text-center shadow-sm">
          <div className="text-4xl mb-4" aria-hidden>
            ⚠
          </div>
          <h1 className="text-lg font-semibold text-[#0A0E1A] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#4B5563] mb-6">
            The application hit an unexpected error. Reload to continue, or try again if this was
            temporary.
          </p>
          {import.meta.env.DEV && (
            <pre className="text-left text-xs bg-[#F1F2F5] p-3 rounded mb-4 overflow-auto max-h-40 text-red-700 whitespace-pre-wrap">
              {error.message}
              {errorInfo?.componentStack
                ? `\n\n${String(errorInfo.componentStack).trim().slice(0, 800)}`
                : ""}
            </pre>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Reload page
            </Button>
            <Button variant="outline" onClick={this.handleRetry}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
