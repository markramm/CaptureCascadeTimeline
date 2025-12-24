import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EventDetails from './EventDetails';

describe('EventDetails', () => {
  const mockEvent = {
    title: 'Test Event',
    date: '2024-01-15',
    description: 'This is a test event description',
    importance: 8,
    actors: ['John Doe', 'Jane Smith'],
    tags: ['politics', 'technology'],
    captureLanes: ['regulatory', 'judicial'],
    sources: ['https://example.com/source1', 'https://example.com/source2'],
    notes: 'Additional notes about the event',
    lastModified: '2024-01-14T10:00:00Z'
  };

  const mockProps = {
    event: mockEvent,
    onClose: jest.fn(),
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    hasNext: true,
    hasPrevious: true,
    currentIndex: 1,
    totalEvents: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders event details correctly', () => {
    render(<EventDetails {...mockProps} />);

    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.description)).toBeInTheDocument();
    expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
  });

  test('displays actors list', () => {
    render(<EventDetails {...mockProps} />);

    mockEvent.actors.forEach(actor => {
      expect(screen.getByText(actor)).toBeInTheDocument();
    });
  });

  test('displays tags', () => {
    render(<EventDetails {...mockProps} />);

    // Tags are rendered as buttons now, verify text
    mockEvent.tags.forEach(tag => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument();
    });
  });

  test('displays capture lanes', () => {
    render(<EventDetails {...mockProps} />);

    mockEvent.captureLanes.forEach(lane => {
      expect(screen.getByText(lane)).toBeInTheDocument();
    });
  });

  test('displays sources as links', () => {
    render(<EventDetails {...mockProps} />);

    // Check for "View Source" links
    const sourceLinks = screen.getAllByText(/View Source/i);
    expect(sourceLinks.length).toBeGreaterThan(0);
  });

  test('handles close button click', () => {
    render(<EventDetails {...mockProps} />);

    // Close button in header or footer
    const closeButtons = screen.getAllByText(/Close/i);
    fireEvent.click(closeButtons[0]);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  test('handles missing optional fields', () => {
    const minimalEvent = {
      id: 'min-1',
      title: 'Minimal Event',
      date: '2024-01-01',
      description: 'Minimal description', // Mapped to summary in component?
      // Component uses event.summary for description text?
      summary: 'Minimal summary',
      status: 'confirmed'
    };

    const minimalProps = {
      ...mockProps,
      event: minimalEvent
    };

    render(<EventDetails {...minimalProps} />);

    expect(screen.getByText(minimalEvent.title)).toBeInTheDocument();
    expect(screen.queryByText(/Key Actors/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Categories/i)).not.toBeInTheDocument();
  });

  test('formats date correctly', () => {
    const eventWithDate = {
      ...mockEvent,
      date: '2023-12-25'
    };

    render(<EventDetails {...mockProps} event={eventWithDate} />);

    expect(screen.getByText(/December 25, 2023/i)).toBeInTheDocument();
  });
});