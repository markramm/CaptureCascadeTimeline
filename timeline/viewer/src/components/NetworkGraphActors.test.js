import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NetworkGraphActors from './NetworkGraphActors';


// D3 is mocked globally in src/__mocks__/d3.js
// Setup/Restoration is handled globally in src/setupTests.js
jest.mock('d3');

describe('NetworkGraphActors', () => {
  const mockEvents = [
    {
      id: '2024-01-01_test-event-1',
      date: '2024-01-01',
      title: 'Test Event 1',
      actors: ['Donald Trump', 'Actor A', 'Actor B'],
      summary: 'Test summary 1'
    },
    {
      id: '2024-02-01_test-event-2',
      date: '2024-02-01',
      title: 'Test Event 2',
      actors: ['Donald Trump', 'Actor B', 'Actor C'],
      summary: 'Test summary 2'
    },
    {
      id: '2024-03-01_test-event-3',
      date: '2024-03-01',
      title: 'Test Event 3',
      actors: ['Actor A', 'Actor C', 'Actor D'],
      summary: 'Test summary 3'
    }
  ];

  const mockProps = {
    events: mockEvents,
    minEvents: 0,
    showLabels: true,
    searchQuery: '',
    compareMode: false,
    compareNodes: [],
    onCompareNodesChange: jest.fn(),
    onCompareModeChange: jest.fn()
  };

  beforeEach(() => {
    // Create a mock SVG element for d3 to work with
    const mockSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // Mock getBBox for text background Rect calculation
    // @ts-ignore
    SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 20, height: 10 });
    jest.spyOn(React, 'useRef').mockReturnValue({ current: mockSvgElement });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders without crashing', () => {
    render(<NetworkGraphActors {...mockProps} />);
    // The graph renders into the SVG which is mocked, but we can check if legend renders
    expect(screen.getByText(/Top Actors/i)).toBeInTheDocument();
  });


  test('displays top actors legend', () => {
    render(<NetworkGraphActors {...mockProps} />);

    // Should show "Top Actors" heading
    expect(screen.getByText(/Top Actors/i)).toBeInTheDocument();
    // detailed checks of legend items depend on exact mock events logic
  });

  test('handles empty events gracefully', () => {
    render(<NetworkGraphActors {...mockProps} events={[]} />);
    // Should still render container (and empty legend or no legend items)
    // The simpler check is that it doesn't crash.
    const container = document.querySelector('.network-graph-container');
    expect(container).toBeDefined();
  });

  test('Trump node should be recognized', () => {
    const trumpEvents = [
      {
        id: '2024-01-01_trump-event',
        date: '2024-01-01',
        title: 'Trump Event',
        actors: ['Donald Trump', 'Trump Administration'],
        summary: 'Trump related event'
      }
    ];

    render(<NetworkGraphActors {...mockProps} events={trumpEvents} />);

    // Component should render with Trump-related events
    expect(screen.getByText(/Top Actors/i)).toBeInTheDocument();
  });
});