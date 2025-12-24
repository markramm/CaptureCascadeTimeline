export type ValidationConfidence = 'high' | 'medium' | 'low' | 'rejected';
export type ValidationType = 'source' | 'factual' | 'cross-reference' | 'comprehensive';

export interface ValidationRecord {
    event_id: string;
    validator_id: string;
    timestamp: string;
    type: ValidationType;
    confidence: ValidationConfidence;
    notes?: string;
    sources_checked?: Array<{ url: string; status: string }>;
}

export interface AggregatedValidation {
    event_id: string;
    validations: ValidationRecord[];
    high_confidence_count: number;
}
