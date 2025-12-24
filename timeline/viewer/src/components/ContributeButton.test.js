import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContributeButton from './ContributeButton';

describe('ContributeButton', () => {
  const defaultProps = {
    eventId: 'test-event-1',
    eventTitle: 'Test Event Title'
  };

  test('renders contribute button', () => {
    render(<ContributeButton />);
    const button = screen.getByTitle(/Contribute to timeline/i);
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Contribute')).toBeInTheDocument();
  });

  test('opens modal when clicked', () => {
    render(<ContributeButton />);
    const button = screen.getByTitle(/Contribute to timeline/i);
    fireEvent.click(button);

    expect(screen.getByText('Contribute to the Timeline')).toBeInTheDocument();
    expect(screen.getByText('Propose New Event')).toBeInTheDocument();
  });

  test('generates correct GitHub issue link for new event', () => {
    render(<ContributeButton />);
    fireEvent.click(screen.getByTitle(/Contribute to timeline/i));

    const link = screen.getByText('Propose New Event').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('issues/new'));
    expect(link).toHaveAttribute('href', expect.stringContaining('title=New+Event'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('generates correct GitHub issue link for correction when event props provided', () => {
    render(<ContributeButton {...defaultProps} />);
    fireEvent.click(screen.getByTitle(/Contribute to timeline/i));

    const link = screen.getByText('Submit Correction').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('issues/new'));
    // URL encoded check for "Correction: Test Event Title"
    expect(link).toHaveAttribute('href', expect.stringContaining('Correction'));
    expect(link).toHaveAttribute('href', expect.stringContaining('Test+Event+Title'));
  });

  test('closes modal via close button', () => {
    render(<ContributeButton />);
    // Open
    fireEvent.click(screen.getByTitle(/Contribute to timeline/i));
    expect(screen.getByText('Contribute to the Timeline')).toBeInTheDocument();

    // Close
    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('Contribute to the Timeline')).not.toBeInTheDocument();
  });
});