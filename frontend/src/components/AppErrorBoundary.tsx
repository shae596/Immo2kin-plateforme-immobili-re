import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Erreur inconnue',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erreur interface:', error, info)
  }

  private handleReload = () => {
    window.location.assign(window.location.origin)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Un problème est survenu
          </h1>
          <p className="max-w-md text-sm text-slate-600">
            {this.state.message}
          </p>
          <p className="max-w-md text-xs text-slate-500">
            Vérifiez que l&apos;API Laravel tourne ({' '}
            <code className="rounded bg-slate-100 px-1">php artisan serve</code>
            ), puis rechargez.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
          >
            Recharger
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
