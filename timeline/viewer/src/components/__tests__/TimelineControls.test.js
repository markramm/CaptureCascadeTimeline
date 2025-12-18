import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimelineControls from '../TimelineControls';

// Mock Minimap to avoid complex rendering in unit test
jest.mock('../TimelineMinimap', () => () => <div data-testid="minimap">Minimap</div>);

describe('TimelineControls Component', () => {
    const mockTimelineControls = {
        compactMode: 'none',
        showMinimap: false
    };

    const mockTimelineData = {
        events: [],
        groups: [],
        onNavigate: jest.fn(),
        onDateRangeSelect: jest.fn(),
        currentDateRange: [new Date(), new Date()]
    };

    const mockOnChange = jest.fn();
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders header button', () => {
        render(
            <TimelineControls
                timelineControls={mockTimelineControls}
                onTimelineControlsChange={mockOnChange}
                timelineData={mockTimelineData}
                isOpen={false}
                onToggle={mockOnToggle}
            />
        );

        expect(screen.getByText('Timeline View')).toBeInTheDocument();
    });

    test('toggles calls onToggle', () => {
        render(
            <TimelineControls
                timelineControls={mockTimelineControls}
                onTimelineControlsChange={mockOnChange}
                timelineData={mockTimelineData}
                isOpen={false}
                onToggle={mockOnToggle}
            />
        );

        fireEvent.click(screen.getByText('Timeline View'));
        expect(mockOnToggle).toHaveBeenCalled();
    });

    test('shows options when open', () => {
        render(
            <TimelineControls
                timelineControls={mockTimelineControls}
                onTimelineControlsChange={mockOnChange}
                timelineData={mockTimelineData}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        expect(screen.getByText('Display Mode')).toBeInTheDocument();
        expect(screen.getByText('Show Minimap')).toBeInTheDocument();
    });

    test('changes display mode', () => {
        render(
            <TimelineControls
                timelineControls={mockTimelineControls}
                onTimelineControlsChange={mockOnChange}
                timelineData={mockTimelineData}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        // Find select by display value or label if we add one.
        // The component has <label>Display Mode</label><select>...
        // Let's assume we need to find it by text for now or add label connection.
        // For now, let's use display value
        const select = screen.getByDisplayValue('Expand All');
        fireEvent.change(select, { target: { value: 'low' } });

        expect(mockOnChange).toHaveBeenCalledWith({
            ...mockTimelineControls,
            compactMode: 'low'
        });
    });

    test('toggles minimap', () => {
        render(
            <TimelineControls
                timelineControls={mockTimelineControls}
                onTimelineControlsChange={mockOnChange}
                timelineData={mockTimelineData}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        const checkbox = screen.getByText('Show Minimap');
        fireEvent.click(checkbox);

        expect(mockOnChange).toHaveBeenCalledWith({
            ...mockTimelineControls,
            showMinimap: true
        });
    });

    test('shows minimap component when enabled', () => {
        render(
            <TimelineControls
                timelineControls={{ ...mockTimelineControls, showMinimap: true }}
                onTimelineControlsChange={mockOnChange}
                timelineData={mockTimelineData}
                isOpen={true}
                onToggle={mockOnToggle}
            />
        );

        expect(screen.getByTestId('minimap')).toBeInTheDocument();
    });
});
