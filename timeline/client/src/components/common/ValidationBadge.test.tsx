
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationBadge } from './ValidationBadge';
import type { ValidationRecord } from '../../schemas/validation';

describe('ValidationBadge', () => {
    it('renders Verified for high confidence', () => {
        const validations: ValidationRecord[] = [
            { event_id: '1', validator_id: 'v1', timestamp: '2024-01-01', type: 'source', confidence: 'high' }
        ];
        render(<ValidationBadge validations={validations} />);
        expect(screen.getByText('Verified')).toBeInTheDocument();
        expect(screen.getByTitle(/Verified by 1 validator/)).toBeInTheDocument();
    });

    it('renders Rejected if any validation is rejected', () => {
        const validations: ValidationRecord[] = [
            { event_id: '1', validator_id: 'v1', timestamp: '2024-01-01', type: 'source', confidence: 'high' },
            { event_id: '1', validator_id: 'v2', timestamp: '2024-01-01', type: 'source', confidence: 'rejected' }
        ];
        render(<ValidationBadge validations={validations} />);
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByTitle('Validation Failed/Rejected')).toBeInTheDocument();
    });

    it('renders nothing if no validations', () => {
        const { container } = render(<ValidationBadge validations={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
