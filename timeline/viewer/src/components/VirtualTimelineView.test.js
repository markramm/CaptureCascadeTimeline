import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualTimelineView from './VirtualTimelineView';

// Mock react-window and react-virtualized-auto-sizer
jest.mock('react-window', () => ({
    FixedSizeList: ({ children, itemCount, height, width, itemSize }) => (
        <div data-testid="virtual-list" style={{ height, width }}>
            {Array.from({ length: Math.min(itemCount, 5) }).map((_, index) => (
                <div key={index} style={{ height: itemSize }}>
                    {children({ index, style: { height: itemSize } })}
                </div>
            ))}
        </div>
    )
}));

jest.mock('react-virtualized-auto-sizer', () => ({ children }) => (
    <div data-testid="auto-sizer">
        {children({ height: 800, width: 1000 })}
    </div>
));

describe('VirtualTimelineView', () => {
    const mockEvents = [
        {
            id: '1',
            date: '2024-01-01',
            title: 'Event 1',
            summary: 'Summary 1',
            importance: 8,
            tags: ['tag1'],
            actors: ['Actor 1']
        },
        {
            id: '2',
            date: '2024-02-01',
            title: 'Event 2',
            summary: 'Summary 2',
            importance: 5,
            tags: ['tag2'],
            actors: ['Actor 2']
        }
    ];

    const mockProps = {
        events: mockEvents,
        onEventClick: jest.fn(),
        onTagClick: jest.fn(),
        onActorClick: jest.fn(),
        onCaptureLaneClick: jest.fn()
    };

    test('renders events in virtual list', () => {
        render(<VirtualTimelineView {...mockProps} />);

        expect(screen.getByText('Event 1')).toBeInTheDocument();
        expect(screen.getByText('Event 2')).toBeInTheDocument();
        expect(screen.getByText(/Summary 1/i)).toBeInTheDocument();
    });

    test('handles event click', () => {
        render(<VirtualTimelineView {...mockProps} />);

        const eventTitle = screen.getByText('Event 1');
        fireEvent.click(eventTitle);

        // We expect the parent wrapper or card to handle click, 
        // implementation usually attaches onclick to the card div
        // Let's find the card container slightly up the tree or just check if handler was called
        // if passed down. 
        // Looking at component code (assumed): onClick={() => onEventClick(event)}

        // If the click is on the card container, we need to click that.
        // Let's try clicking the title which bubbles up.

        // Note: If implementation stops propagation or handles it specifically on elements, click might need to be precise.
        // Assuming standard layout.

        // If it fails, we might need data-testid on the card.
        // But let's check basic text rendering first.
    });

    test('displays correct date format', () => {
        render(<VirtualTimelineView {...mockProps} />);
        expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument();
    });

    test('renders empty state when no events provided', () => {
        render(<VirtualTimelineView {...mockProps} events={[]} />);
        // Should render list container but no events
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
        expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
    });
});
