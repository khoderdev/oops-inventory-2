import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import React from "react";

export const ErrorFallback = ({ pageTitle }: { pageTitle?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
    <div className="animate-fade-in space-y-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">{pageTitle ? `There was an error loading ${pageTitle}.` : "An unexpected error occurred."} Please try refreshing the page or contact support if the problem persists.</p>
      </div>
      <Button onClick={() => window.location.reload()} variant="outline" className="btn-touch">
        Refresh Page
      </Button>
    </div>
  </div>
);

// Simple error boundary component
export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
