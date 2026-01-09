import { z } from 'zod';

export const VerificationStatus = z.enum([
    'unverified',
    'verified',
    'disputed',
    'debunked',
    'needs_review'
]);

export const VerificationRecord = z.object({
    id: z.string().uuid(),
    timestamp: z.string().datetime(),
    type: z.enum(['human', 'ai_agent']),
    agent_id: z.string(), // e.g., "user_github_handle" or "gpt-4o-auditor"
    status: VerificationStatus,
    confidence_score: z.number().min(0).max(100),
    notes: z.string(),
    evidence_quote: z.string().optional() // Specific text from source supporting the verdict
});

// Current schema version - increment when making breaking changes
export const CURRENT_SCHEMA_VERSION = '1.0' as const;

export const TimelineEventSchema = z.object({
    id: z.string().min(1), // Relaxed UUID constraint for legacy IDs which might be slugs
    title: z.string().min(5).max(150), // Relaxed min(10) to 5 for legacy
    date: z.string().regex(/^\d{4}(-\d{2}-\d{2})?$/, "ISO 8601 Date Required (YYYY or YYYY-MM-DD)"),

    // Content
    summary: z.string().min(10).describe("Neutral, factual summary"), // Relaxed min(50)
    content: z.string().describe("Extended markdown content").optional(),

    // Classification
    type: z.enum(['legislative', 'judicial', 'financial', 'corporate', 'political', 'cultural']).optional(), // Optional for legacy
    tags: z.array(z.string()).min(1),
    entities: z.array(z.string()).describe("Named entities (People/Orgs) for Graph linking").optional(),

    // UX Metadata
    importance: z.number().min(1).max(10).default(5).describe("Visual importance weight (1-10)"),
    status: z.enum(['confirmed', 'likely', 'disputed', 'retracted']).default('confirmed'),

    // Sourcing & Truth
    sources: z.array(z.object({
        url: z.string().url(),
        title: z.string().optional(),
        date_accessed: z.string().datetime().optional(),
        tier: z.enum(['1', '2', '3']).optional().describe("Source quality tier: 1=Primary, 2=Reliable, 3=Weak")
    })).min(0),

    verification_history: z.array(VerificationRecord).default([]),

    // Federation Metadata
    upstream_repo: z.string().describe("The git repository this event belongs to").optional(),
    canonical_hash: z.string().describe("Hash of the content for integrity checks").optional()
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type VerificationRecord = z.infer<typeof VerificationRecord>;

/**
 * Timeline Data wrapper - the format of timeline.json files
 * Supports both wrapped format (with metadata) and raw array format (legacy)
 */
export const TimelineDataSchema = z.object({
    // Schema version for compatibility checking
    schema_version: z.string().default(CURRENT_SCHEMA_VERSION),

    // Timeline metadata
    name: z.string().optional(),
    description: z.string().optional(),
    upstream_repo: z.string().optional(),

    // The events
    events: z.array(TimelineEventSchema),

    // Generation metadata
    generated_at: z.string().datetime().optional(),
    event_count: z.number().optional(),
});

export type TimelineData = z.infer<typeof TimelineDataSchema>;

/**
 * Parse timeline data from JSON, handling both wrapped and legacy formats
 */
export function parseTimelineData(data: unknown): TimelineData {
    // If it's an array, wrap it in the new format
    if (Array.isArray(data)) {
        return {
            schema_version: CURRENT_SCHEMA_VERSION,
            events: data as TimelineEvent[],
        };
    }

    // Try to parse as wrapped format
    return TimelineDataSchema.parse(data);
}

/**
 * Check if schema versions are compatible
 */
export function isSchemaCompatible(version: string): boolean {
    const [major] = version.split('.');
    const [currentMajor] = CURRENT_SCHEMA_VERSION.split('.');
    return major === currentMajor;
}
