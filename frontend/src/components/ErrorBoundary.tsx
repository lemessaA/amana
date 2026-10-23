"use client";

import React, { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Alert className="max-w-md bg-danger/10 border-danger/30 text-danger">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="mt-2">Something Went Wrong</AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                {this.state.error?.message || "An unexpected error occurred"}
              </AlertDescription>
              <Button 
                onClick={this.reset} 
                variant="secondary" 
                size="sm"
                className="mt-4 flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            </Alert>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
