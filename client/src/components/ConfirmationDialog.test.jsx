import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmationDialog from './ConfirmationDialog.jsx';

function DialogHost({ onCancel = vi.fn(), onConfirm = vi.fn() }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      {open ? (
        <ConfirmationDialog
          title="Delete Book?"
          message='Are you sure you want to delete "The Hobbit"? This cannot be undone.'
          confirmLabel="Delete"
          danger
          onCancel={() => {
            onCancel();
            setOpen(false);
          }}
          onConfirm={onConfirm}
        />
      ) : null}
    </>
  );
}

describe('ConfirmationDialog', () => {
  it('moves focus into the dialog, traps tab, restores focus, and closes on Escape', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<DialogHost onCancel={onCancel} />);

    const opener = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(dialog).toHaveAccessibleDescription(/delete "The Hobbit"/i);

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(cancel).toHaveFocus();

    await user.tab();
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
