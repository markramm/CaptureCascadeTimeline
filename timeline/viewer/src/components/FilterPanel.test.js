import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterPanel from './FilterPanel';

// Mock child components to isolate FilterPanel logic
jest.mock('./GraphControls', () => () => <div data-testid="graph-controls">Graph Controls</div>);
jest.mock('./TimelineControls', () => () => <div data-testid="timeline-controls">Timeline Controls</div>);

describe('FilterPanel', () => {
  const mockProps = {
    allTags: ['politics', 'technology', 'finance'],
    allActors: ['John Doe', 'Jane Smith', 'Acme Corp'],
    allCaptureLanes: ['regulatory', 'judicial', 'legislative'],
    selectedTags: [],
    selectedActors: [],
    selectedCaptureLanes: [],
    dateRange: { start: null, end: null },
    onTagsChange: jest.fn(),
    onActorsChange: jest.fn(),
    onCaptureLanesChange: jest.fn(),
    onDateRangeChange: jest.fn(),
    onClear: jest.fn(),
    eventCount: 50,
    totalCount: 100,
    viewMode: 'timeline',
    timelineControls: { compactMode: 'none', showMinimap: false },
    onTimelineControlsChange: jest.fn(),
    timelineData: { events: [], groups: [] },
    events: [],
    sortOrder: 'chronological',
    onSortOrderChange: jest.fn(),
    minImportance: 0,
    onMinImportanceChange: jest.fn(),
    graphControls: {},
    onGraphControlsChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders filter panel with key sections', () => {
    render(<FilterPanel {...mockProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Sort Order')).toBeInTheDocument();
    expect(screen.getByText('Importance Level')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument(); // Was Tags
    expect(screen.getByText('Actors')).toBeInTheDocument();
  });

  test('displays event stats correctly', () => {
    render(<FilterPanel {...mockProps} />);

    // Stats are split into separate elements now
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    // 'Total: 100' is now a single string in the new UI
    expect(screen.getByText('Total: 100')).toBeInTheDocument();
  });

  test('handles clear filters', () => {
    // Render with active filters to show the clear button
    render(<FilterPanel {...mockProps} selectedTags={['politics']} />);

    const clearButton = screen.getByText('Clear');
    fireEvent.click(clearButton);

    expect(mockProps.onClear).toHaveBeenCalledTimes(1);
  });

  test('handles sort order change', () => {
    render(<FilterPanel {...mockProps} />);

    // Expand sort section if needed (it defaults to true usually)
    const newestRadio = screen.getByLabelText('Newest First');
    fireEvent.click(newestRadio);

    expect(mockProps.onSortOrderChange).toHaveBeenCalledWith('newest');
  });

  test('handles importance filter change via select', () => {
    render(<FilterPanel {...mockProps} />);

    // Find the select element (it might have a label or be implied)
    // We can look for the combustion that handles importance
    const select = screen.getByDisplayValue('All Events (1-10)');
    fireEvent.change(select, { target: { value: '5' } });

    expect(mockProps.onMinImportanceChange).toHaveBeenCalledWith(5);
  });

  test('renders TimelineControls when in timeline mode', () => {
    render(<FilterPanel {...mockProps} viewMode="timeline" />);
    expect(screen.getByTestId('timeline-controls')).toBeInTheDocument();
  });

  test('renders GraphControls when in graph mode', () => {
    render(<FilterPanel {...mockProps} viewMode="graph" />);
    expect(screen.getByTestId('graph-controls')).toBeInTheDocument();
  });

  test('handles date range inputs', () => {
    render(<FilterPanel {...mockProps} />);

    // Date inputs might not have explicit labels connected via htmlFor in the simplified test environment
    // but they usually have labels. Let's check typical structure.
    // Based on code: <label>From</label><input type="date">

    const inputs = screen.getAllByDisplayValue('');
    const dateInputs = inputs.filter(i => i.type === 'date');
    // Expect at least 2 date inputs (Start/End)
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });
    expect(mockProps.onDateRangeChange).toHaveBeenCalled();
  });

  test('shows contribute link', () => {
    render(<FilterPanel {...mockProps} />);
    expect(screen.getByText('Contribute on GitHub')).toBeInTheDocument();
  });
});