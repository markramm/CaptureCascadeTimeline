import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GraphControls from '../GraphControls';

describe('GraphControls Component', () => {
    const mockGraphControls = {
        layout: 'force',
        maxNodes: 200,
        connectionStrength: 0.5,
        showLabels: false,
        showMetrics: false
    };

    const mockOnChange = jest.fn();
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders nothing when controls are missing', () => {
        const { container } = render(<GraphControls />);
        expect(container).toBeEmptyDOMElement();
    });

    test('renders header button regardless of open state', () => {
        render(
            <GraphControls
                graphControls={mockGraphControls}
                onGraphControlsChange={mockOnChange}
                isOpen={false}
                onToggle={mockOnToggle}
            />
        );

        expect(screen.getByText('Graph Appearance')).toBeInTheDocument();
    });

    test('toggle button calls onToggle prop', () => {
        render(
            <GraphControls
                graphControls={mockGraphControls}
                onGraphControlsChange={mockOnChange}
                isOpen={false}
                onToggle={mockOnToggle}
            />
        );

        fireEvent.click(screen.getByText('Graph Appearance'));
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    test('shows content when isOpen is true', () => {
        render(
            <GraphControls
                graphControls={mockGraphControls}
                onGraphControlsChange={mockOnChange}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        expect(screen.getByLabelText('Layout Style')).toBeInTheDocument();
        expect(screen.getByLabelText('Max Nodes')).toBeInTheDocument();
        expect(screen.getByLabelText('Show Labels')).toBeInTheDocument();
    });

    test('calls onChange when layout changes', () => {
        render(
            <GraphControls
                graphControls={mockGraphControls}
                onGraphControlsChange={mockOnChange}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        const select = screen.getByLabelText('Layout Style');
        fireEvent.change(select, { target: { value: 'grid' } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...mockGraphControls,
            layout: 'grid'
        });
    });

    test('calls onChange when slider changes', () => {
        render(
            <GraphControls
                graphControls={mockGraphControls}
                onGraphControlsChange={mockOnChange}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        const slider = screen.getByLabelText('Max Nodes');
        fireEvent.change(slider, { target: { value: '300' } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...mockGraphControls,
            maxNodes: 300
        });
    });

    test('calls onChange when checkbox toggles', () => {
        render(
            <GraphControls
                graphControls={mockGraphControls}
                onGraphControlsChange={mockOnChange}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        const checkbox = screen.getByLabelText('Show Labels');
        fireEvent.click(checkbox);

        expect(mockOnChange).toHaveBeenCalledWith({
            ...mockGraphControls,
            showLabels: true
        });
    });
});
