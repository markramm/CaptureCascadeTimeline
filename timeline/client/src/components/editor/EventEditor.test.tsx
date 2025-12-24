
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventEditor } from './EventEditor';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('../../db', () => ({
    db: {
        events: {
            get: vi.fn(),
            put: vi.fn().mockResolvedValue('id-123')
        }
    }
}));

describe('EventEditor', () => {

    it('renders New Event form correctly', () => {
        render(
            <BrowserRouter>
                <EventEditor />
            </BrowserRouter>
        );

        expect(screen.getByText('New Event')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Event Title')).toBeInTheDocument();
        expect(screen.getByText('Save Event')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(
            <BrowserRouter>
                <EventEditor />
            </BrowserRouter>
        );

        const saveBtn = screen.getByText('Save Event');
        fireEvent.click(saveBtn); // Click save without filling anything

        // Zod schema requires Title (min 5), Date, Summary (min 10), Sources
        // Expect error messages
        await waitFor(() => {
            // We look for text that might appear. 
            // Note: The specific error messages depend on Zod schema validation messages.
            // Title: String must contain at least 5 character(s)
            // Date: ISO 8601 Date Required...
            // We can just check that we are still on the page or errors exist.
            // Actually, let's just check console or specific error elements class 'error'
            const errors = document.querySelectorAll('.error');
            expect(errors.length).toBeGreaterThan(0);
        }); // End waitFor
    }); // End validates required fields

    it('allows adding tags', async () => {
        render(
            <BrowserRouter>
                <EventEditor />
            </BrowserRouter>
        );

        // Find TagInput by placeholder "Add thematic tag..."
        const tagInput = screen.getByPlaceholderText('Add thematic tag...');
        fireEvent.change(tagInput, { target: { value: 'Corruption' } });
        fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

        // Check if tag appears
        expect(screen.getByText('Corruption')).toBeInTheDocument();
    });

    it('shows AI Verify button', () => {
        render(
            <BrowserRouter>
                <EventEditor />
            </BrowserRouter>
        );
        expect(screen.getByText('AI Verify')).toBeInTheDocument();
    });
});
