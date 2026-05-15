import { Component } from 'react'
import Button from './ui/Button'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-semibold text-primary">Etwas ist schiefgelaufen</p>
          <p className="max-w-md text-sm text-muted">{this.state.error.message}</p>
          <Button onClick={() => window.location.reload()}>Seite neu laden</Button>
        </div>
      )
    }
    return this.props.children
  }
}
