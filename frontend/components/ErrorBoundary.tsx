"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    label?: string;       // e.g. "Analytics Chart" for context in error msg
    onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — wraps any section that might crash at runtime.
 *
 * Usage:
 *   <ErrorBoundary label="Readiness Ring">
 *     <ProgressRing ... />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[ErrorBoundary${this.props.label ? ` "${this.props.label}"` : ""}]`, error, info);
        this.props.onError?.(error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                    <span className="text-2xl">⚠️</span>
                    <p className="text-sm text-red-300 font-medium">
                        {this.props.label
                            ? `"${this.props.label}" failed to render.`
                            : "Something went wrong."}
                    </p>
                    {this.state.error && (
                        <p className="text-xs text-white/30 font-mono max-w-xs truncate">
                            {this.state.error.message}
                        </p>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="text-xs px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition mt-1"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}