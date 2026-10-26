// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SlashMenuPopover } from '../SlashMenuPlugin';

const rect = (top: number, left: number, height: number) =>
    ({ top, left, bottom: top + height, right: left, width: 0, height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

describe('slash menu placement', () => {
    it('waits for Lexical to place its anchor, then opens under the caret', async () => {
        // Like a browser: until Lexical attaches the anchor it measures as a detached box at the origin.
        const element = document.createElement('div');
        element.getBoundingClientRect = () => element.isConnected ? rect(300, 180, 20) : rect(0, 0, 0);
        render(<SlashMenuPopover anchor={{ current: element }}><p>Add a block</p></SlashMenuPopover>);
        const menu = screen.getByText('Add a block').parentElement!;
        expect(menu.style.visibility).toBe('hidden');

        // Lexical's own effect runs after the popover's: it styles the anchor, then attaches it.
        await act(async () => {
            element.style.top = '320px';
            document.body.append(element);
        });
        expect(menu.style.visibility).toBe('');
        expect(menu.style.top).toBe('326px');
        expect(menu.style.left).toBe('180px');
        element.remove();
    });
});
