import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Modal from './Modal'

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      <Modal
        isOpen={open}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        title="Dialog"
        footer={<button>last</button>}
      >
        <input aria-label="field" />
      </Modal>
    </>
  )
}

describe('Modal accessibility', () => {
  it('is a labelled modal dialog that takes focus when opened', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('open'))
    const dialog = screen.getByRole('dialog', { name: 'Dialog' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()
  })

  it('keeps Tab focus inside the dialog (wraps last -> first)', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('open'))
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 8; i++) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const trigger = screen.getByText('open')
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
