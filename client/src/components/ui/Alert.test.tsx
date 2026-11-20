import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Alert from './Alert'

describe('Alert', () => {
  it('uses role=alert for errors and role=status for success', () => {
    const { rerender } = render(<Alert variant="error">Boom</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Boom')
    rerender(<Alert variant="success">Saved</Alert>)
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
  })

  it('renders an optional title', () => {
    render(<Alert variant="info" title="Heads up">Body</Alert>)
    expect(screen.getByText('Heads up')).toBeInTheDocument()
  })
})
