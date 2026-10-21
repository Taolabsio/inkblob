// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TableGridSelector } from '../TableGridSelector';
afterEach(cleanup);
describe('table insertion controls', () => {
  it('uses the clicked dimensions without requiring a previous hover', () => {
    const select = vi.fn(), close = vi.fn();
    render(<TableGridSelector position={{ top: 20, left: 20 }} close={close} onSelect={select} />);
    fireEvent.click(screen.getByRole('button', { name: 'Insert 3 by 2 table' }));
    expect(select).toHaveBeenCalledWith(2, 3);
    expect(close).toHaveBeenCalledTimes(1);
  });
  it('moves focus and dimensions with arrow keys, then allows activation', () => {
    const select = vi.fn();
    render(<TableGridSelector position={{ top: 20, left: 20 }} close={vi.fn()} onSelect={select} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Insert 1 by 1 table' }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Insert 2 by 2 table' }));
    fireEvent.click(document.activeElement!);
    expect(select).toHaveBeenCalledWith(2, 2);
  });
  it('cancels with Escape without inserting a table', () => {
    const select = vi.fn(), close = vi.fn();
    render(<TableGridSelector position={{ top: 20, left: 20 }} close={close} onSelect={select} />);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(close).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
  });
});
