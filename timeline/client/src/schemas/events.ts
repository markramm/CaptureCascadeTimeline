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

    // Sourcing & Truth
    sources: z.array(z.object({
        url: z.string().url(),
        title: z.string().optional(),
        date_accessed: z.string().datetime().optional()
    })).min(0),

    verification_history: z.array(VerificationRecord).default([]),

    // Federation Metadata
    upstream_repo: z.string().describe("The git repository this event belongs to").optional(),
    canonical_hash: z.string().describe("Hash of the content for integrity checks").optional()
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type VerificationRecord = z.infer<typeof VerificationRecord>;
