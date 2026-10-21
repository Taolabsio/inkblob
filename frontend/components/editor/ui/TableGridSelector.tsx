import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopoverPosition } from './usePopoverPosition';

interface TableGridSelectorProps { onSelect: (rows: number, cols: number) => void; close: () => void; position: { top: number; left: number } }
export function TableGridSelector({ onSelect, close, position }: TableGridSelectorProps) {
  const [size, setSize] = useState({ rows: 1, cols: 1 });
  const ref = useRef<HTMLDivElement>(null);
  const clamped = usePopoverPosition(ref, position);
  useEffect(() => { ref.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, []);
  return createPortal(<><button className="fixed inset-0 z-50" aria-label="Cancel table insertion" onClick={close} />
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Insert table" className="table-grid-selector" style={clamped}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'Tab') { event.preventDefault(); }
        let { rows, cols } = size;
        if (event.key === 'ArrowRight') cols = Math.min(10, cols + 1);
        else if (event.key === 'ArrowLeft') cols = Math.max(1, cols - 1);
        else if (event.key === 'ArrowDown') rows = Math.min(10, rows + 1);
        else if (event.key === 'ArrowUp') rows = Math.max(1, rows - 1);
        else return;
        event.preventDefault(); setSize({ rows, cols });
        ref.current?.querySelector<HTMLButtonElement>(`[data-cell="${rows}-${cols}"]`)?.focus();
      }}>
      <p aria-live="polite">{size.cols} {size.cols === 1 ? 'column' : 'columns'} × {size.rows} {size.rows === 1 ? 'row' : 'rows'}</p>
      <div className="table-size-grid">{Array.from({ length: 100 }, (_, index) => {
        const rows = Math.floor(index / 10) + 1, cols = index % 10 + 1;
        return <button key={index} data-cell={`${rows}-${cols}`} aria-label={`Insert ${cols} by ${rows} table`} tabIndex={size.rows === rows && size.cols === cols ? 0 : -1}
          className={rows <= size.rows && cols <= size.cols ? 'is-active' : ''} onMouseEnter={() => setSize({ rows, cols })}
          onClick={() => { onSelect(rows, cols); close(); }} />;
      })}</div><small>Use arrow keys, then Enter. Esc to cancel.</small>
    </div></>, document.body);
}
