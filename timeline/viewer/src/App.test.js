import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import axios from 'axios';
import * as useUrlStateHook from './hooks/useUrlState';

// Proper Mock for Axios with Hoisting Handling
jest.mock('axios', () => {
  const mockInstance = {
    get: jest.fn(),
    interceptors: {
      response: { use: jest.fn() },
      request: { use: jest.fn() }
    }
  };
  return {
    create: jest.fn(() => mockInstance),
    get: jest.fn() // Fallback
  };
});

// Mock d3 - Using Manual Mock in __mocks__/d3.js
jest.mock('d3');

// Mock useUrlState
jest.mock('./hooks/useUrlState');

// Mock useResearchMonitoring to prevent async warnings
jest.mock('./hooks/useResearchMonitoring', () => ({
  useResearchMonitoring: () => ({
    activities: [],
    summary: {
      total_events: 100,
      active_priorities: 0,
      staged_events_count: 0,
      commit_progress: '0/10'
    },
    error: null,
    isPolling: false,
    clearActivities: jest.fn(),
    refreshNow: jest.fn()
  })
}));

describe('Timeline App', () => {
  const mockUpdateUrl = jest.fn();
  // Get the singleton mock instance to configure
  const mockAxiosInstance = axios.create();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Note: Global D3 mock restoration is handled in setupTests.js

    // Mock matchMedia for framer-motion (Robust implementation)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock IndexedDB
    const mockIndexedDB = {
      open: jest.fn().mockReturnValue({
        result: {
          objectStoreNames: { contains: jest.fn() },
          createObjectStore: jest.fn(),
          transaction: jest.fn(),
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        onsuccess: null,
        onerror: null,
      }),
    };
    global.indexedDB = mockIndexedDB;

    // Mock global fetch for LandingPage.js
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          total_events: 100,
          total_sources: 50, // Added to prevent undefined error
          date_range: { start: '1990', end: '2024' },
          total_tags: 10,
          total_actors: 20
        })
      })
    );

    // Mock Canvas for TimelineMinimap
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn(),
      arc: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      fillText: jest.fn(),
      font: '',
      fillStyle: ''
    }));

    // Default URL state mock (Timeline View default)
    useUrlStateHook.useUrlState.mockReturnValue({
      urlState: {
        showLanding: false,
        viewMode: 'timeline',
        graphControls: {},
        actorControls: {},
        showStats: false
      },
      updateUrl: mockUpdateUrl,
      getStateFromUrl: jest.fn()
    });

    // Default axios mock implementation
    mockAxiosInstance.get.mockImplementation((url) => {
      console.log('MockAxios GET:', url);
      // url includes full path potentially, or relative
      // apiService requests `timeline.json` for events
      if (url.includes('timeline.json') || url.includes('events.json')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('tags.json')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('stats.json')) {
        return Promise.resolve({
          data: {
            total_events: 0,
            date_range: { start: null, end: null },
            total_tags: 0,
            total_actors: 0,
            events_by_year: {},
            events_by_status: {}
          }
        });
      }
      if (url.includes('actors.json')) {
        return Promise.resolve({ data: { actors: [] } });
      }

      return Promise.resolve({ data: [] });
    });
  });

  test('renders timeline view by default', async () => {
    await act(async () => {
      render(<App />);
    });

    // Use findByText to wait for content, handling potential fast load
    expect(await screen.findByText(/The Kleptocracy Timeline/i)).toBeInTheDocument();
    expect(screen.queryByText(/View Interactive Timeline/i)).not.toBeInTheDocument();
  });

  test('renders landing page when requested via URL state', async () => {
    useUrlStateHook.useUrlState.mockReturnValue({
      urlState: {
        showLanding: true,
        viewMode: 'timeline'
      },
      updateUrl: mockUpdateUrl,
      getStateFromUrl: jest.fn()
    });

    await act(async () => {
      render(<App />);
    });

    expect(await screen.findAllByText(/View Interactive Timeline/i)).toHaveLength(1); // Button only
  });

  test('enters timeline from landing page', async () => {
    useUrlStateHook.useUrlState.mockReturnValue({
      urlState: {
        showLanding: true,
        viewMode: 'timeline'
      },
      updateUrl: mockUpdateUrl,
      getStateFromUrl: jest.fn()
    });

    await act(async () => {
      render(<App />);
    });

    const enterButton = (await screen.findAllByText(/View Interactive Timeline/i))[0];
    fireEvent.click(enterButton);

    expect(mockUpdateUrl).toHaveBeenCalledWith(expect.objectContaining({
      showLanding: false
    }));
  });

  test('search filters events', async () => {
    const mockEvents = [
      {
        id: '2024-01-01_first-event',
        date: '2024-01-01',
        title: 'First Event',
        summary: 'First test summary',
        tags: ['test'],
        actors: ['Actor One'],
        status: 'confirmed'
      },
      {
        id: '2024-02-01_second-event',
        date: '2024-02-01',
        title: 'Second Event',
        summary: 'Second test summary',
        tags: ['test'],
        actors: ['Actor Two'],
        status: 'confirmed'
      }
    ];

    mockAxiosInstance.get.mockImplementation((url) => {
      console.log('Test Specific MockAxios GET:', url);
      if (url.includes('timeline.json') || url.includes('events.json')) {
        return Promise.resolve({ data: mockEvents });
      }
      if (url.includes('tags.json')) return Promise.resolve({ data: [] });
      if (url.includes('actors.json')) return Promise.resolve({ data: { actors: [] } });
      if (url.includes('stats.json')) {
        return Promise.resolve({
          data: {
            total_events: 2,
            date_range: { start: '2024-01-01', end: '2024-02-01' },
            total_tags: 1,
            total_actors: 2,
            events_by_year: { '2024': 2 },
            events_by_status: { 'confirmed': 2 }
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    await act(async () => {
      render(<App />);
    });

    const input = screen.getByPlaceholderText(/Search events/i);
    expect(input).toBeInTheDocument();

    await waitFor(() => {
      // Use more flexible matcher
      const stats = screen.getByTestId('event-count-display');
      expect(stats).toHaveTextContent(/2.*Events/i);
    });

    fireEvent.change(input, { target: { value: 'First' } });

    await waitFor(() => {
      const stats = screen.getByTestId('event-count-display');
      expect(stats).toHaveTextContent(/1.*Event/i);
    });
  });

  test('filter panel toggles visibility', async () => {
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Toggle Filters')).toBeInTheDocument();
    });

    const filterToggle = screen.getByTitle('Toggle Filters');
    fireEvent.click(filterToggle);

    await waitFor(() => {
      expect(screen.getByText(/Categories/i)).toBeInTheDocument();
    });
  });

  test('stats panel toggles visibility', async () => {
    // Provide stats data to ensure it can render
    mockAxiosInstance.get.mockImplementation((url) => {
      if (url.includes('stats.json')) {
        return Promise.resolve({
          data: {
            total_events: 10,
            date_range: { start: '2020-01-01', end: '2024-01-01' },
            total_tags: 5,
            total_actors: 5,
            events_by_year: {},
            events_by_status: {}
          }
        });
      }
      return Promise.resolve({ data: [] });
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByTitle('Toggle Statistics')).toBeInTheDocument();
    });

    const statsToggle = screen.getByTitle('Toggle Statistics');
    fireEvent.click(statsToggle);

    await waitFor(() => {
      expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    });
  });
});