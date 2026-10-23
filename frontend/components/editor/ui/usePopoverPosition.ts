import { RefObject, useLayoutEffect, useState } from 'react';
export interface PopoverPosition { top: number; left: number }
export function clampPopoverPosition(position: PopoverPosition, width: number, height: number, viewportWidth: number, viewportHeight: number): PopoverPosition {
  return { top: Math.max(8, Math.min(position.top, viewportHeight - height - 8)), left: Math.max(8, Math.min(position.left, viewportWidth - width - 8)) };
}
export function usePopoverPosition(ref: RefObject<HTMLElement | null>, position: PopoverPosition) {
  const [clamped, setClamped] = useState(position);
  const { top, left } = position;
  useLayoutEffect(() => {
    const update = () => {
      const bounds = ref.current?.getBoundingClientRect();
      if (bounds) setClamped(clampPopoverPosition({ top, left }, bounds.width, bounds.height, window.innerWidth, window.innerHeight));
    };
    update();
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ref.current) observer?.observe(ref.current);
    return () => { window.removeEventListener('resize', update); observer?.disconnect(); };
  }, [ref, top, left]);
  return clamped;
}
