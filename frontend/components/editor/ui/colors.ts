export interface ColorSwatch {
    label: string;
    /** CSS color value applied to the selection - `var(--x)` values track the active theme
     *  (light/dark) automatically since index.css defines those custom properties per-theme. */
    value: string;
    swatch: string;
}

export const TEXT_COLORS: ColorSwatch[] = [
    { label: 'Default', value: 'inherit', swatch: 'transparent' },
    { label: 'Purple', value: 'var(--editor-purple)', swatch: 'var(--editor-purple)' },
    { label: 'Pink', value: 'var(--editor-pink)', swatch: 'var(--editor-pink)' },
    { label: 'Cyan', value: 'var(--editor-cyan)', swatch: 'var(--editor-cyan)' },
    { label: 'Red', value: 'var(--editor-red)', swatch: 'var(--editor-red)' },
    { label: 'Orange', value: 'var(--editor-orange)', swatch: 'var(--editor-orange)' },
    { label: 'Green', value: 'var(--editor-green)', swatch: 'var(--editor-green)' },
    { label: 'Gray', value: 'var(--text-muted)', swatch: 'var(--text-muted)' },
];

// Fixed rgba (not color-mix(), for broader browser compatibility) - approximates each theme
// color at 25% opacity so highlights stay legible against both light and dark backgrounds.
export const HIGHLIGHT_COLORS: ColorSwatch[] = [
    { label: 'None', value: 'transparent', swatch: 'transparent' },
    { label: 'Purple', value: 'rgba(139, 92, 246, 0.25)', swatch: 'var(--editor-purple)' },
    { label: 'Pink', value: 'rgba(236, 72, 153, 0.25)', swatch: 'var(--editor-pink)' },
    { label: 'Cyan', value: 'rgba(6, 182, 212, 0.25)', swatch: 'var(--editor-cyan)' },
    { label: 'Red', value: 'rgba(248, 113, 113, 0.25)', swatch: '#f87171' },
    { label: 'Orange', value: 'rgba(251, 146, 60, 0.25)', swatch: '#fb923c' },
    { label: 'Green', value: 'rgba(74, 222, 128, 0.25)', swatch: '#4ade80' },
    { label: 'Gray', value: 'rgba(160, 160, 160, 0.25)', swatch: 'var(--text-muted)' },
];
