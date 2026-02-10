import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                    <div className="bg-destructive/10 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
                        Por favor, tente recarregar a página.
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="bg-muted p-4 rounded-lg text-xs text-left overflow-auto max-w-2xl w-full mb-6 border border-border">
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <Button onClick={this.handleReload} size="lg">
                        Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
