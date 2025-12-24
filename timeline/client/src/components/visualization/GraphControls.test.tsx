
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphControls } from './GraphControls';

describe('GraphControls Component', () => {
    it('renders all control sections', () => {
        render(<GraphControls />);
        expect(screen.getByText('View Mode')).toBeInTheDocument();
        expect(screen.getByText('Layout Mode')).toBeInTheDocument();
        expect(screen.getByText('Search Filters')).toBeInTheDocument();
        expect(screen.getByText('Max Nodes')).toBeInTheDocument();
    });

    it('toggles collapse state', () => {
        render(<GraphControls />);
        const toggleBtn = screen.getAllByRole('button')[0]; // First button is usually toggle in header
        fireEvent.click(toggleBtn);
        expect(screen.queryByText('View Mode')).not.toBeInTheDocument();
    });
});
