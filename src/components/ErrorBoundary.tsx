
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error securely without exposing sensitive information
    console.error('Application error caught by boundary:', {
      message: error.message,
      stack: error.stack?.substring(0, 500), // Limit stack trace length
      componentStack: errorInfo.componentStack?.substring(0, 500)
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                Error de aplicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                Ha ocurrido un error inesperado. Por favor, recarga la página.
              </p>
              {this.state.error?.message && (
                <p className="text-center text-red-600 text-sm">
                  {this.state.error.message}
                </p>
              )}
              <p className="text-center text-gray-500 text-sm">
                Revisa la consola del navegador para ver el seguimiento completo
                del error.
              </p>
              <div className="flex justify-center space-x-2">
                <Button onClick={this.handleReload} variant="default">
                  Recargar página
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false })} 
                  variant="outline"
                >
                  Intentar de nuevo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
